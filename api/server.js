var app = require('koa.io')(),
    _ = require('lodash'),
    moment = require('moment'),
    concat = require('concat-stream'),
    https = require('https'),
    mongo = require('mongodb').MongoClient,
    JSONStream = require('JSONStream');

mongo.connect('mongodb://localhost/bpm', function(err, db) {
    var sstream = db.collection('stream');
    var tracks = db.collection('tracks');
    var last = {},
        currentevent;

    // http://www.siriusxm.com/metadata/pdt/en-us/json/channels/thebeat/timestamp/02-25-08:10:00
    var sirius = '/metadata/pdt/en-us/json/channels/thebeat/timestamp/',
        badIds = ['^I', ''];

    app.use(require('koa-compress')());
    app.use(require('koa-cors')());
    app.use(require('koa-router')(app));
    // json middleware
    app.use(function*(next) {
        this.type = 'json';
        yield next;
    });

    // setup last
    tracks.find().sort({$natural: -1}).limit(1).next(function(err, doc) {
        last = doc;
    });

    // routes
    app.get('/recentBPM', function*(next) {
        this.body = sstream.find({
            heard: {
                $gt: moment().subtract(1, 'days').toDate()
            }
        }).sort({$natural: -1}).stream().pipe(JSONStream.stringify());
        yield next;
    });
    app.get('/new', function*(next) {
        this.body = tracks.find({}).sort({$natural: -1}).limit(100).stream().pipe(JSONStream.stringify());
        yield next;
    });
    app.get('/mostHeard', function*(next) {
        this.body = sstream.aggregate([
            {$match: {heard: {$gt: moment().subtract(7, 'days').toDate()}}},
            {$group: {
                _id: '$xmSongID',
                count: {$sum: 1},
                xmSongID: {$first: '$xmSongID'},
                track: {$first: '$track'},
                spotify: {$first: '$spotify'},
                artists: {$first: '$artists'},
                heard: {$first: '$heard'}}},
            {$sort: {count: -1}},
            {$limit: 100}
        ]).stream().pipe(JSONStream.stringify());
        yield next;
    });
    app.get('/artist/:artist', function*(next) {
        this.body = tracks.find({artists: this.params.artist}).stream().pipe(JSONStream.stringify());
        yield next;
    });
    app.get('/song/:song', function*(next) {
        var songID = this.params.song.replace('-', '#');
        this.body = tracks.find({xmSongID: songID}).limit(1).stream().pipe(JSONStream.stringify());
        yield next;
    });
    app.get('/songstream/:song', function*(next) {
        var songID = this.params.song.replace('-', '#');
        this.body = sstream.aggregate([{
            $match: {
                xmSongID: songID
            }
        }, {
            $group: {
                _id: {
                    month: {
                        $month: '$heard'
                    },
                    day: {
                        $dayOfMonth: '$heard'
                    },
                    year: {
                        $year: '$heard'
                    }
                },
                count: {
                    $sum: 1
                }
            }
        }]).stream().pipe(JSONStream.stringify());
        yield next;
    });

    function spotify(artists, track, info, callback) {
        var query = 'artist:' + artists + '+track:' + track + '&type=track';
        console.log('https://api.spotify.com/v1/search?query=' + query);
        https.get({
            host: 'api.spotify.com',
            path: ('/v1/search?query=' + query)
        }, function(response) {
            response.pipe(concat(function(body) {
                var res = JSON.parse(body);
                var chosen = _.max(res.tracks.items, 'popularity');
                if (chosen !== -Infinity) {
                    info.spotify.artists = _.pluck(chosen.artists, 'name');
                    info.spotify.name = chosen.name;
                    info.spotify.url = chosen.external_urls.spotify;
                    info.spotify.album_image = chosen.album.images[0].url;
                    info.spotify.album = chosen.album.name;
                }
                callback(info);
            }));
        }).on('error', function(e) {
            callback(info);
            console.log('problem with request: ' + e.message);
        });
    }

    function updateTrack(info) {
        app.io.emit('bpm', info);
        sstream.insert(info);
        tracks.update({
            xmSongID: info.xmSongID
        }, {
            $inc: {
                'plays': 1
            },
            $currentDate: {
                lastHeard: true
            },
            $setOnInsert: {
                firstHeard: moment.utc().toDate(),
                artists: info.artists,
                track: info.track,
                xmSongID: info.xmSongID,
                spotify: info.spotify
            }
        }, {
            upsert: true
        });
    }

    function newSong(artists, track, xmInfo) {
        console.log(artists);
        console.log(track);
        var info = {
            'spotify': {},
            'artists': artists.split('#')[0].split('/'),
            'track': track.split('#')[0],
            'xmSongID': xmInfo.song.id,
            'heard': moment.utc().toDate()
        };
        last = info;
        artists = artists.split('#')[0].replace(/[\s\/\\()]/g, '+');
        track = track.split('#')[0].replace(/[\s\/\\()]/g, '+');
        tracks.find({xmSongID: info.xmSongID}).limit(1).next(function(err, doc) {
            if (doc) {
                info.spotify = doc.spotify;
                updateTrack(info);
            } else {
                spotify(artists, track, info, function(info) {
                    updateTrack(info);
                });
            }
        });
    }

    function checkEndpoint() {
        var datetime = moment.utc().subtract(1, 'minute').format('MM-DD-HH:mm:00');
        console.log(sirius + datetime);
        https.get({
            host: 'www.siriusxm.com',
            path: (sirius + datetime)
        }, function(response) {
            response.pipe(concat(function(body) {
                var res, cur;
                try {
                    res = JSON.parse(body);
                    cur = res.channelMetadataResponse.metaData.currentEvent;
                } catch (e) {
                    console.log(e);
                }
                if (cur && res.channelMetadataResponse.messages.code !== 305 && cur.song.id !== currentevent && last.xmSongID !== cur.song.id) {
                    currentevent = cur.song.id;
                    if (badIds.indexOf(cur.song.id) === -1) {
                        newSong(cur.artists.name, cur.song.name, cur);
                    }
                }
            }));
        });
    }
    setInterval(checkEndpoint, 20 * 1000);

    app.listen(5000);
});

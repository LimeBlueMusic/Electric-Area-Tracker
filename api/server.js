var app = require('koa.io')(),
    _ = require('lodash'),
    moment = require('moment'),
    concat = require('concat-stream'),
    https = require('https'),
    mongo = require('mongodb').MongoClient,
    JSONStream = require('JSONStream'),
    config = require('./config');


var last = {},
    currentevent,
    db;

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
app.get('/recentBPM', recentBPM);
app.get('/new', newsongs);
app.get('/mostHeard', mostHeard);
app.get('/artists', allArtists);
app.get('/artist/:artist', artists);
app.get('/song/:song', song);
app.get('/songstream/:song', songstream);

// routes
function* recentBPM(next){
    this.body = db.collection('stream').find({
        heard: {$gt: moment().subtract(1, 'days').toDate()}
    }).sort({$natural: -1}).stream().pipe(JSONStream.stringify());
    yield next;
}
function* newsongs(next){
    this.body = db.collection('tracks').find({}).sort({$natural: -1}).limit(100).stream().pipe(JSONStream.stringify());
    yield next;
}
function* mostHeard(next){
    this.body = db.collection('stream').aggregate([
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
}
function* artists(next){
    console.log(this.params.artist);
    this.body = db.collection('tracks').find({artists: this.params.artist}).stream().pipe(JSONStream.stringify());
    yield next; 
}
function distinctArtists(callback){
    db.collection('tracks').distinct('artists', function(err, doc){
        callback(null, doc);
    });
}
function* allArtists(next){
    // i may be doing this wrong, but it works
    this.body = yield distinctArtists;
}
function* song(next){
    var songID = this.params.song.replace('-', '#');
    this.body = db.collection('tracks').find({xmSongID: songID}).limit(1).stream().pipe(JSONStream.stringify());
    yield next;
}
function* songstream(next){
    var songID = this.params.song.replace('-', '#');
    this.body = db.collection('stream').aggregate([{
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
}

mongo.connect(config.db, function(err, conn) {
    db = conn;
    db.collection('stream').find({}).sort({$natural: -1}).limit(1).next(function(err, doc) {
        last = doc;
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
        db.collection('stream').insert(info);
        db.collection('tracks').update({xmSongID: info.xmSongID},
        {
            $inc: {'plays': 1},
            $currentDate: {lastHeard: true},
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
        db.collection('tracks').find({xmSongID: info.xmSongID}).limit(1).next(function(err, doc) {
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

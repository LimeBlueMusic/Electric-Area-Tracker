var app = require('koa.io')(),
    _ = require('lodash'),
    db = require('monk')('localhost/bpm'),
    moment = require('moment'),
    concat = require('concat-stream'),
    https = require('https');

var history = [],
    newToday = [],
    currentevent,
    tracks = db.get('tracks'),
    stream = db.get('stream');

// http://www.siriusxm.com/metadata/pdt/en-us/json/channels/thebeat/timestamp/02-25-08:10:00
var sirius = '/metadata/pdt/en-us/json/channels/thebeat/timestamp/',
    badIds = ['^I', ''];

app.use(require('koa-cors')());

// Setup Indexes if they don't exist
tracks.ensureIndex('xmSongID', {
    unique: true
});
stream.ensureIndex('xmSongID');
stream.ensureIndex('heard');

// setup last 24 hours history
stream.find({heard: {$gt: moment().subtract(1, 'days').toISOString()}}, {
    'sort': [['$natural', -1]]})
.on('success', function(res) {
    history = res;
});

app.io.route('recentBPM', function*() {
    this.emit('recentBPM', history);
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

function newSong(artists, track, xmInfo) {
    console.log(artists);
    console.log(track);
    var info = {
        'spotify': {},
        'artists': artists.split('#')[0].split('/'),
        'track': track.split('#')[0],
        'xmSongID': xmInfo.song.id,
        'heard': moment.utc().toISOString()
    };
    artists = artists.split('#')[0].replace(/[\s\/\\()]/g, '+');
    track = track.split('#')[0].replace(/[\s\/\\()]/g, '+');
    spotify(artists, track, info, function(info) {
        stream.insert(info).success(function(doc){
            app.io.emit('bpm', doc);
            console.log(doc);
            history.unshift(doc);
        });

        // move spotify to setOnInsert
        tracks.update({'xmSongID': info.xmSongID}, {
            $inc: {'plays': 1},
            $set: {spotify: info.spotify},
            $currentDate: {lastHeard: true},
            $setOnInsert: {
                firstHeard: moment.utc().toISOString(),
                artists: info.artists,
                track: info.track,
                xmSongID: info.xmSongID,
            }
        }, {
            upsert: true
        });
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
            if (cur && res.channelMetadataResponse.messages.code !== 305 && cur.song.id !== currentevent && history[0].xmSongID !== cur.song.id) {
                currentevent = cur.song.id;
                if (badIds.indexOf(cur.song.id) === -1) {
                    newSong(cur.artists.name, cur.song.name, cur);
                }
            }
        }));
    });
}
setInterval(checkEndpoint, 15 * 1000);


app.listen(5000);
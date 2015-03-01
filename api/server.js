var app = require('koa.io')(),
    _ = require('lodash'),
    db = require('monk')('localhost/bpm'),
    request = require('request'),
    moment = require('moment'),
    concat = require('concat-stream'),
    http = require('http');

var history = [],
    url = 'https://api.spotify.com/v1/search?query=',
    currentevent,
    tracks = db.get('tracks'),
    badIds = ['^I', ''];

// http://www.siriusxm.com/metadata/pdt/en-us/json/channels/thebeat/timestamp/02-25-08:10:00
var sirius = '/metadata/pdt/en-us/json/channels/thebeat/timestamp/';

app.use(require('koa-cors')());

tracks.find({}, {'sort': [['$natural', -1]], 'limit': 5}, function(err, res){
    history = res;
});


app.io.route('recentBPM', function* () {
    this.emit('recentBPM', history);
});


function spotify(artists, track, info, callback) {
    var query = 'artist:' + artists + '+track:' + track + '&type=track';
    console.log(url + query);
    request(url + query, function(error, response, body) {
        if (!error && response.statusCode == 200) {
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
        } else {
            callback(info);
        }
    });
}

function newSong(artists, track, xmInfo) {
    console.log(artists);
    console.log(track);
    var info = {
        'spotify': {},
        'artists': artists.split('#')[0].split('/'),
        'track': track.split('#')[0],
        'xmSongID': xmInfo.song.id
    };
    artists = artists.split('#')[0].replace(/[\s\/()]/g, '+');
    track = track.split('#')[0].replace(/[\s\/()]/g, '+');
    spotify(artists, track, info, function(info) {
        app.io.emit('bpm', info);
        tracks.insert(info);
        console.log(info);
        history.push(info);
    });
}

function checkEndpoint() {
    var datetime = moment.utc().subtract(1, 'minute').format('MM-DD-HH:mm:00');
    console.log(sirius + datetime);
    return http.get({
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
            if (cur && res.channelMetadataResponse.messages.code !== 305 && cur.song.id !== currentevent) {
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
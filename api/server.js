'use strict';

const app = require('koa.io')();
const _ = require('lodash');
const moment = require('moment');
const mongo = require('mongodb').MongoClient;
const JSONStream = require('JSONStream');
const route = require('koa-route');
const cors = require('kcors');
const config = require('./config');
const rp = require('request-promise');

var last = {},
    currentevent,
    db;

// http://www.siriusxm.com/metadata/pdt/en-us/json/channels/thebeat/timestamp/02-25-08:10:00
var sirius = '/metadata/pdt/en-us/json/channels/thebeat/timestamp/',
    badIds = ['^I', ''];

app.use(cors());
// json middleware
app.use(function*(next) {
    this.type = 'json';
    yield next;
});
app.use(route.get('/recentBPM', recentBPM));
app.use(route.get('/new', newsongs));
app.use(route.get('/mostHeard', mostHeard));
app.use(route.get('/artists', allArtists));
app.use(route.get('/artist/:artist', artists));
app.use(route.get('/song/:song', songFromID));
app.use(route.get('/songstream/:song', songstream));

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
function* artists(artist, next){
    this.body = db.collection('tracks').find({artists: artist}).stream().pipe(JSONStream.stringify());
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
function* songFromID(song, next){
    this.body = db.collection('tracks').find({xmSongID: song.replace('-', '#')}).limit(1).stream().pipe(JSONStream.stringify());
    yield next;
}
function* songstream(song, next){
    var songID = song.replace('-', '#');
    this.body = db.collection('stream').aggregate([
        {$match: {xmSongID: songID}},
        {$group: {_id: {month: {$month: '$heard'}, day: {$dayOfMonth: '$heard'}, year: {$year: '$heard'}}, count: {$sum: 1}}}
    ]).stream().pipe(JSONStream.stringify());
    yield next;
}
    
function spotify(artists, track, info, callback) {
    let query = 'artist:' + artists + '+track:' + track + '&type=track';
    console.log('https://api.spotify.com/v1/search?query=' + query);
    let options = {
        uri: 'http://api.spotify.com/v1/search',
        qs: {
            query: query
        },
        json: true
    };
    rp(options).then(res => {
        var chosen = _.max(res.tracks.items, 'popularity');
        if (chosen !== -Infinity) {
            info.spotify.artists = _.pluck(chosen.artists, 'name');
            info.spotify.name = chosen.name;
            info.spotify.url = chosen.external_urls.spotify;
            info.spotify.album_image = chosen.album.images[0].url;
            info.spotify.album = chosen.album.name;
        }
        callback(info);
    }).catch(e => {
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
    let datetime = moment.utc().subtract(1, 'minute').format('MM-DD-HH:mm:00');
    console.log(sirius + datetime);
    let options = {
        uri: 'http://www.siriusxm.com' + sirius + datetime,
        json: true
    };
    rp(options).then((res)=>{
        var cur;
        try {
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
    });
}

// init application
mongo.connect(config.db, function(err, connection) {
    db = connection;
    db.collection('stream').find({}).sort({$natural: -1}).limit(1).next(function(err, doc) {
        if (err) throw err;
        last = doc;
        app.listen(5000);
        checkEndpoint();
        setInterval(checkEndpoint, 20 * 1000);
    });
});

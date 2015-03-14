var mongo = require('mongodb').MongoClient;

mongo.connect('mongodb://localhost/bpm', function(err, db) {
    var sstream = db.collection('stream');
    var tracks = db.collection('tracks');
    // Setup Indexes if they don't exist
    tracks.ensureIndex('xmSongID', {
        unique: true
    });
    sstream.ensureIndex('xmSongID');
    sstream.ensureIndex('heard');
});
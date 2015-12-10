# bpm_tracker
Tracking satellite radio station BPM and storing the data in mongo.
Broken down into a AngularJS frontend and Node backend with websockets provided by koa.io.

Built for io.js v1.5.1

Endpoint tracked  
```HTTP
http://www.siriusxm.com/metadata/pdt/en-us/json/channels/thebeat/timestamp/02-25-08:10:00
```


```javascript
db.tracks.ensureIndex({'artists': 1});
db.stream.ensureIndex({'xmSongID': 1});
db.stream.ensureIndex({'heard': 1});
```
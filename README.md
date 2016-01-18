# BPM Radio Station Tracking
![http://imgur.com/8rIKBwt](running example)

Tracking sirius xm satellite radio station BPM and storing the data in mongo.
Broken down into a AngularJS frontend and Node backend with websockets from koa.io to show live streaming tracks. Built using bootstrap 4.
Could easily be modified to track other radio stations.

#### Frontend
```bash
npm i -g bower gulp
bower install
npm install
gulp serve
```

#### Backend
```bash
npm install
node index.js
```

##### Endpoint tracked  
```HTTP
http://www.siriusxm.com/metadata/pdt/en-us/json/channels/thebeat/timestamp/02-25-08:10:00
```

##### Database indexes
```javascript
db.tracks.ensureIndex({'artists': 1});
db.stream.ensureIndex({'xmSongID': 1});
db.stream.ensureIndex({'heard': 1});
```
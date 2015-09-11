class songstream {
    constructor($http, baseurl, socket) {
        'ngInject';
        this.recent = [];
        this.isWatching = false;
        this.base = baseurl.base;
        this.socket = socket.connection();
        this.$http = $http;
    }
    get(callback) {
        if (this.recent.length !== 0) {
            callback(this.recent);
        } else {
            this.$http.get(this.base + '/recentBPM')
                .success((data) => {
                    for(let obj of data){
                        obj.xmSongID = obj.xmSongID.replace('#', '-');
                    }
                    this.recent = data;
                    callback(this.recent);
                });
        }
        if (!this.isWatching) {
            this.isWatching = true;
            this.socket.on('bpm', (data) => {
                data.xmSongID = data.xmSongID.replace('#', '-');
                this.recent.unshift(data);
            });
        }
    }
}

export default songstream;
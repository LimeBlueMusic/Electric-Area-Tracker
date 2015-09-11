class socket {
    constructor(socketFactory, baseurl, io) {
        'ngInject';
        this.socketFactory = socketFactory;
        this.base = baseurl.base;
        this.io = io;
    }
    connection() {
        return this.socketFactory({
            ioSocket: this.io.connect(this.base)
        });
    }
}

export default socket;

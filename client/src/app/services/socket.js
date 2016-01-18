class socket {
    constructor(socketFactory, baseurl) {
        'ngInject';
        this.socketFactory = socketFactory;
        this.base = baseurl.base;
    }
    connection() {
        return this.socketFactory({
            ioSocket: io.connect(this.base)
        });
    }
}

export default socket;

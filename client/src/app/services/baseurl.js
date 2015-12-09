class baseurl {
    constructor($location) {
        'ngInject';
        this.host = $location.host();
    }
    get base() {
        if (this.host === 'localhost') {
            return '//localhost:5000';
        }
        return '//bpmbackend.scttcper.com';
    }
}

export default baseurl;

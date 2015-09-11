class PopularController {
    constructor($http, baseurl) {
        'ngInject';

        $http.get(baseurl.base + '/mostHeard').then((res) => {
            this.songs = res.data;
        });

    }
}

export default PopularController;

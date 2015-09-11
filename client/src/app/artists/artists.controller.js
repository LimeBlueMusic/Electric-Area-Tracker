class ArtistsController {
    constructor($http, baseurl) {
        'ngInject';

        $http.get(baseurl.base + '/artists').then((res) => {
            this.artists = res.data;
        });

    }
}

export default ArtistsController;

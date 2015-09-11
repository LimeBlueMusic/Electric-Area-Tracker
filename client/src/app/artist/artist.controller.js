class ArtistController {
    constructor($http, baseurl, $routeParams) {
        'ngInject';

        this.artist = $routeParams.artist;

        $http.get(baseurl.base + '/artist/' + $routeParams.artist).then((res) => {
            this.songs = res.data;
        });
    }
}

export default ArtistController;

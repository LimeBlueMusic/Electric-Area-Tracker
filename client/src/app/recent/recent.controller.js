class RecentController {
    constructor($http, baseurl) {
        'ngInject';

        $http.get(baseurl.base + '/new').then((res) => {
            this.songs = res.data;
        });

    }
}

export default RecentController;

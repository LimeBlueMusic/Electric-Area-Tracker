class SongController {
    constructor($http, baseurl, $routeParams, _, MG) {
        'ngInject';

        $http.get(baseurl.base + '/songstream/' + $routeParams.song.replace('#', '-')).then(function(data) {
            let parseddata = _.map(data, function(n) {
                return {
                    date: new Date(n._id.year, n._id.month, n._id.day),
                    plays: n.count
                };
            });
            MG.data_graphic({
                data: parseddata,
                target: '#plays',
                x_accessor: 'date',
                y_accessor: 'plays',
                full_width: true,
                xax_count: 0,
                show_secondary_x_label: false,
                xax_tick_length: 0,
                yax_count: 0,
                missing_is_zero: true,
                buffer: 0,
                left: 0,
                right: 0,
                top: 21,
                bottom: 0
            });
        });

        $http.get(baseurl.base + '/song/' + $routeParams.song.replace('#', '-')).then((res) => {
            this.song = res.data[0];
        });

    }
}

export default SongController;

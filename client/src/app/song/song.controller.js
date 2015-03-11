'use strict';

angular.module('client').controller('SongCtrl', function($scope, $http, baseURL, $routeParams) {
    $scope.song = $routeParams.song;
    $http.get(baseURL + '/songstream/' + $routeParams.song.replace('#', '-')).success(function(data) {
        var parseddata = _.map(data, function(n){
            var stringdate = n._id.year + '-' + n._id.month + '-' + n._id.day;
            return {date: moment(stringdate, 'YYYY-MM-DD').toDate(), plays: n.count};
        });
        MG.data_graphic({
            data: parseddata,
            target: '#plays',
            x_accessor: "date",
            y_accessor: "plays",
            full_width: true
        });
    });

    $http.get(baseURL + '/song/' + $routeParams.song.replace('#', '-')).success(function(data){
        $scope.song = data[0];
    });

});
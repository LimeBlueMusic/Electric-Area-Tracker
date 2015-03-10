'use strict';

angular.module('client').controller('SongCtrl', function($scope, $http, baseURL, $routeParams) {
    $scope.song = $routeParams.song;
    $http.get(baseURL + '/song/' + $routeParams.song).success(function(data) {
        $scope.data = _.map(data, function(n){
            return {date: moment(n.date).startOf('day').toDate(), value: 1};
        });
    });

    $scope.options = {
        title: 'Histograms can be time series as well',
        chart_type: 'line',
        width: 400
    };


    //     var fake_data = function(length, seconds) {
    //     var d = new Date();
    //     var v = 100000;
    //     var data=[];

    //     for (var i = 0; i < length; i++){
    //         v += (Math.random() - 0.5) * 10000;
    //         data.push({date: MG.clone(d), value: v});
    //         d = new Date(d.getTime() + seconds * 1000);
    //     }
    //     return data;
    // };
    // $scope.options = {
    //     title: 'Histograms can be time series as well',
    //     chart_type: 'histogram',
    //     width: 400,
    //     binned: true,
    // };
    // var data = fake_data(25, 60).map(function(d){
    //     d.value = Math.round(d.value);
    //     return d;
    // });
    // $scope.data = data;
});
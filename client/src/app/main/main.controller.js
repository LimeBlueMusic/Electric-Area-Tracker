'use strict';

angular.module('client').controller('MainCtrl', function($scope, socket) {
    var hypem = function(track, artists) {
        var str = track.replace(/[\s\/()]/g, '+') + '+' + artists.join('+').replace(/[\s\/()]/g, '+');
        return encodeURI(str);
    };
    $scope.recent = [];
    socket.on('bpm', function(data) {
        data.hypem = hypem(data.track, data.artists);
        $scope.recent.unshift(data);
    });

    // var fake_data = function(length, seconds) {
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
    
    socket.on('recentBPM', function(data) {
        angular.forEach(data, function(value, key) {
            value.hypem = hypem(value.track, value.artists);
        });
        $scope.recent = $scope.recent.concat(data);
    });
    socket.emit('recentBPM');
});
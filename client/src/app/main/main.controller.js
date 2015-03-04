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
    socket.on('recentBPM', function(data) {
        angular.forEach(data, function(value, key) {
            value.hypem = hypem(value.track, value.artists);
        });
        $scope.recent = $scope.recent.concat(data);
    });
    socket.emit('recentBPM');
});
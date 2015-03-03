'use strict';

angular.module('client').controller('MainCtrl', function($scope, socket) {
    $scope.recent = [];
    socket.on('bpm', function(data) {
        $scope.recent.unshift(data);
    });
    socket.on('recentBPM', function(data){
        $scope.recent = $scope.recent.concat(data);
    });
    socket.emit('recentBPM');
});
'use strict';

angular.module('client').controller('MainCtrl', function($scope, $http, $window, socket, songstream) {
    var mostHeard = function(history){
        var songid = _.chain(history).pluck('xmSongID').countBy().pairs().max(_.last).first().value();
        $scope.mostHeard = _.find(history, 'xmSongID', songid);
        $scope.unique24 = _.uniq(history, function(hist) { return hist.xmSongID; });
    };

    songstream.get(function(data){
        $scope.recent = data;
        mostHeard($scope.recent);
    });

    
});
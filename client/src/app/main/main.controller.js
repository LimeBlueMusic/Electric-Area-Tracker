'use strict';

angular.module('client').controller('MainCtrl', function($scope, $http, $window, socket, songstream) {
    $scope.hypem = function(song) {
        var str = song.track.replace(/[\s\/()]/g, '+') + '+' + song.artists.join('+').replace(/[\s\/()]/g, '+');
        $window.open('http://hypem.com/search/'+str+'/1/?sortby=favorite', '_blank');
    };
    var mostHeard = function(history){
        var songid = _.chain(history).pluck('xmSongID').countBy().pairs().max(_.last).first().value();
        $scope.mostHeard = _.find(history, 'xmSongID', songid);
        $scope.unique24 = _.uniq(history, function(hist) { return hist.xmSongID; });
    };
    
    $scope.$on('bpm', function(event, data){
        $scope.recent.unshift(data);
        mostHeard($scope.recent);
    });    

    songstream.get(function(data){
        $scope.recent = data;
        mostHeard($scope.recent);
    });
    songstream.watch();

    
});
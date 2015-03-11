'use strict';

angular.module('client').controller('MainCtrl', function($scope, $http, $window, socket, baseURL) {
    $scope.hypem = function(song) {
        var str = song.track.replace(/[\s\/()]/g, '+') + '+' + song.artists.join('+').replace(/[\s\/()]/g, '+');
        $window.open('http://hypem.com/search/'+str+'/1/?sortby=favorite', '_blank');
    };
    var mostHeard = function(history){
        var songid = _.chain(history).pluck('xmSongID').countBy().pairs().max(_.last).first().value();
        $scope.mostHeard = _.find(history, 'xmSongID', songid);
        $scope.unique24 = _.uniq(history, function(hist) { return hist.xmSongID; });
    };
    socket.on('bpm', function(data) {
        data.xmSongID = data.xmSongID.replace('#', '-');
        $scope.recent.unshift(data);
        mostHeard($scope.recent);
    });

    $http.get(baseURL + '/recentBPM')
    .success(function(data) {
        angular.forEach(data, function(obj){
            obj.xmSongID = obj.xmSongID.replace('#', '-');
        });
        $scope.recent = data;
        mostHeard(data);
    });
});
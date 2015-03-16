'use strict';

angular.module('client').controller('LinksCtrl', function($scope) {
    $scope.hypem = function(song){
        if(!song)return;
        var str = song.track.replace(/[\s\/()]/g, '+') + '+' + song.artists.join('+').replace(/[\s\/()]/g, '+');
        return 'http://hypem.com/search/' + str + '/1/?sortby=favorite';
    };

    $scope.youtube = function(song){
        if(!song)return;
        var str = song.track.replace(/[\s\/()]/g, '+') + '+' + song.artists.join('+').replace(/[\s\/()]/g, '+');
        return 'https://www.youtube.com/results?search_query=' + str;
    };
    
});
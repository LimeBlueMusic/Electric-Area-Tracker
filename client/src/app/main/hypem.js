angular.module('client').directive('hypem', function () {
    'use strict';
    return {
            restrict: 'A',
            scope: {
                song: '=hypem'
            },
            link: function(scope, element, attrs) {
                var str = scope.song.track.replace(/[\s\/()]/g, '+') + '+' + scope.song.artists.join('+').replace(/[\s\/()]/g, '+');
                element.attr('href', 'http://hypem.com/search/'+str+'/1/?sortby=favorite');
            }
        };
});
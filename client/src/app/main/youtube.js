angular.module('client').directive('youtube', function () {
    'use strict';
    return {
            restrict: 'A',
            scope: {
                song: '=youtube'
            },
            link: function(scope, element, attrs) {
                if(!scope.song)return;
                var str = scope.song.track.replace(/[\s\/()]/g, '+') + '+' + scope.song.artists.join('+').replace(/[\s\/()]/g, '+');
                element.attr('href', 'https://www.youtube.com/results?search_query='+str);
            }
        };
});
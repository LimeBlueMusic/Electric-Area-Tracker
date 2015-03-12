'use strict';

angular.module('client', [
    'ngRoute',
    'btford.socket-io',
    'ngEqualizer',
    'picardy.fontawesome',
    'angularMoment',
    'afkl.lazyImage'
]).config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
    }).when('/song/:song', {
        templateUrl: 'app/song/song.html',
        controller: 'SongCtrl'
    }).when('/artist/:artist', {
        templateUrl: 'app/artist/artist.html',
        controller: 'ArtistCtrl'
    }).otherwise({
        redirectTo: '/'
    });
}).factory('socket', function(socketFactory, $location) {
    if ($location.host().split(':')[0] === 'localhost') {
        return socketFactory({
            ioSocket: io.connect('//localhost:5000')
        });
    } else {
        return socketFactory({
            ioSocket: io.connect('//localhost:5000')
        });
    }

}).factory('baseURL', function($location) {
    if ($location.host().split(':')[0] === 'localhost') {
        return '//localhost:5000';
    } else {
        return '//backend.bpm.scttcper.com';
    }
}).factory('songstream', function(socket, baseURL, $http, $rootScope) {
    var recent = [];
    var isWatching = false;
    return {
        get: function(callback) {
            if (recent.length !== 0) {
                callback(recent);
            } else {
                $http.get(baseURL + '/recentBPM')
                    .success(function(data) {
                        angular.forEach(data, function(obj) {
                            obj.xmSongID = obj.xmSongID.replace('#', '-');
                        });
                        recent = data;
                        callback(recent);
                    });
            }
            if (!isWatching) {
                isWatching = true;
                socket.on('bpm', function(data) {
                    data.xmSongID = data.xmSongID.replace('#', '-');
                    console.log('socket');
                    recent.unshift(data);
                });
            }
        }
    };

});
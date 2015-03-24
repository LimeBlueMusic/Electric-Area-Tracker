'use strict';

angular.module('client', [
    'ngRoute',
    'btford.socket-io',
    'picardy.fontawesome',
    'angularMoment',
    'mgcrea.ngStrap',
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
    }).when('/artists', {
        templateUrl: 'app/artist/artists.html',
        controller: 'ArtistsCtrl'
    }).when('/new', {
        templateUrl: 'app/new/new.html',
        controller: 'NewCtrl'
    }).when('/mostPlayed', {
        templateUrl: 'app/mostPlayed/mostplayed.html',
        controller: 'MostPlayedCtrl'
    }).otherwise({
        redirectTo: '/'
    });
}).factory('socket', function(socketFactory, baseURL) {
    return socketFactory({
        ioSocket: io.connect(baseURL)
    });
}).factory('baseURL', function($location) {
    if ($location.host().indexOf('local') !== -1) {
        return '//localhost:5000';
    } else {
        return '//bpmbackend.scttcper.com';
    }
}).factory('songstream', function(socket, baseURL, $http) {
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
                    recent.unshift(data);
                });
            }
        }
    };

});
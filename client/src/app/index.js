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
    }).otherwise({
        redirectTo: '/'
    });
}).factory('socket', function(socketFactory, $location) {
    if ($location.host().split(':')[0] === 'localhost') {
        return socketFactory({ioSocket: io.connect('//localhost:5000')});
    } else {
        return socketFactory({ioSocket: io.connect('//localhost:5000')});
    }
    
}).factory('baseURL', function($location){
    if ($location.host().split(':')[0] === 'localhost') {
        return '//localhost:5000';
    } else {
        return '//backend.bpm.scttcper.com';
    }
});
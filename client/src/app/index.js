'use strict';

angular.module('client', ['ngAnimate',
    'ngRoute',
    'mgcrea.ngStrap',
    'btford.socket-io',
    'ngEqualizer',
    'picardy.fontawesome',
    'angularMoment',
    'metricsgraphics',
]).config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
    }).otherwise({
        redirectTo: '/'
    });
}).factory('socket', function(socketFactory) {
    return socketFactory({
        ioSocket: io.connect('http://localhost:5000')
    });
});
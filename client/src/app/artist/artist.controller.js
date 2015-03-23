'use strict';

angular.module('client').controller('ArtistCtrl', function($scope, $routeParams, $http, baseURL) {
    $scope.artist = $routeParams.artist;
    
    $http.get(baseURL + '/artist/' + $routeParams.artist).success(function(data){
        $scope.songs = data;
    });
});
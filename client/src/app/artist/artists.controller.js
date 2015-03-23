'use strict';

angular.module('client').controller('ArtistsCtrl', function($scope, $http, baseURL) {
    
    $http.get(baseURL + '/artists').success(function(data){
        $scope.artists = data;
    });
});
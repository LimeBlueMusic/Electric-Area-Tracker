'use strict';

angular.module('client').controller('MostPlayedCtrl', function($scope, baseURL, $http) {
    $http.get(baseURL + '/mostHeard').success(function(res){
        $scope.songs = res;
    });
    
});
'use strict';

angular.module('client').controller('NewCtrl', function($scope, baseURL, $http) {
    $http.get(baseURL + '/new').success(function(res){
        $scope.week = res;
    });
    
});
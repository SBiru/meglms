'use strict';
(function(angular){
    angular.module('app').controller('TestSchoolsContainer',['$scope','$modalInstance',function($scope,$modalInstance){
        $scope.cancel = $modalInstance.dismiss;
    }])
}(angular));
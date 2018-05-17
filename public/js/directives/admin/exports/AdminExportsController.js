'use strict';
(function(angular){
    angular.module('app').controller("AdminExportsController",['$scope','OrganizationV2',function($scope,OrganizationV2){
        $scope.orgId = $scope.$stateParams.organizationId;
        function init(){
            getInfo()
        }
        function getInfo(){
            OrganizationV2.get({id:$scope.orgId}).$promise.then(function(org){
                $scope.preferences = org.preferences.length===0?{}:org.preferences;

            })
        }

        var unWatch = $scope.$watch('preferences',function(preferences){
            if(preferences){
                OrganizationV2.updatePreferences(angular.extend({id:$scope.orgId,deleteAll:false},preferences));
            }
        },true);
        $scope.$on("$destroy",function(){
            unWatch();
        });
        init();
    }]);

}(angular));
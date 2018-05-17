if(!angular.isDefined(appControllers))
    appControllers = angular.module('app.testbank');
appControllers.controller('RubricsBaseController', [ '$scope','$state',
    function($scope,$state){
        $scope.rubric_id = angular.isDefined($scope.$stateParams.id)?$scope.$stateParams.id:0
        $scope.org_id = angular.isDefined($scope.$stateParams.org_id)?$scope.$stateParams.org_id:0
        $scope.state = $state.current.name;

        
    }
]);
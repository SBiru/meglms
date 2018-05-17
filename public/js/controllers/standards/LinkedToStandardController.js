appControllers.controller('LinkedToStandardController', [ '$scope','Standard',
    function($scope,Standard){
        $scope.standard_id = $scope.$root.$stateParams.id;
        Standard.linked({
            standard_id:$scope.standard_id
        },function(response){
            $scope.entities = response.standards;
        });
    }
]);
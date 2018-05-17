appControllers.controller('StandardMenuController', [ '$scope','Standard','StandardData',
    function($scope,Standard,StandardData){
        $scope.dataService = StandardData;
        $scope.teste=function(){
            console.log($scope);
        }
        $scope.$watch('t.currentNode',function(){
            if($scope.t.currentNode)
                window.location.href = '#/'+$scope.$root.$stateParams.org_id + "/" + $scope.t.currentNode.id
        });
    }

])
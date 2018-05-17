appControllers.controller('GraderTopNavController',['$scope','$controller','GraderData','GraderModes',function($scope,$controller,GraderData,GraderModes){

    $scope.graderData = GraderData;
    $scope.graderModes = GraderModes;
    $scope.loading = true;

    //inheriting controllers
    $controller('GraderNavController', {$scope: $scope});
    $controller('StudentFilter', {$scope: $scope});
    $controller('ActivityFilter', {$scope: $scope});
    $controller('DateFilter', {$scope: $scope});
    $controller('ModeFilter', {$scope: $scope});


    $scope.$root.$on('FINISHED_LOADING_COURSES',function(){
        $scope.loading = false;
    })

}]).value('GraderModes',[{id:'needing',originalLabel:"Needing grade", label:"Needing grade",p:0},{id:'graded',originalLabel:"Already graded", label:"Already graded",p:1}]);
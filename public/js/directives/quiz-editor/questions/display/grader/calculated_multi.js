(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayCalculatedmultiGrader', [
        function(){
            return {
                restrict:'E',
                scope:false,
                template:'<display-simple-grader></display-simple-grader>',
                link:function($scope){
                   $scope.prepareQuestion=function(){};
                }

            }
        }
    ]);
}());

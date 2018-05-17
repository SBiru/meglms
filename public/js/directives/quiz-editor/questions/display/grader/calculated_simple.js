(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayCalculatedsimpleGrader', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/grader/simple_answer.html',
                link:function($scope){
                    $scope.prepareQuestion=function(){

                    };

                }
            }
        }
    ]);
}());

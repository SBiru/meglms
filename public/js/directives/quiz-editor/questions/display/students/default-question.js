//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayDefaultStudent', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/students/default-question.html',
                link:function($scope){
                    $scope.prepareQuestion=function(){};
                    if($scope.question.extra && $scope.question.type=='truefalse' && typeof  $scope.question.extra === 'string'){
                        $scope.question.extra = JSON.parse($scope.question.extra)
                    }
                }
                
            }
        }
    ]);
}());


//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var MIN_WIDTH_OF_EMPTY_BOX = 15
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayCalculatedmultiReview', [
        '$compile',
        function($compile){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/students/multiple_choice.html',
                link:function($scope,$element){
                    $scope.isReview=true;
                }
            }
        }
    ]);
}());

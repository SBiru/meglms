//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayWordmatchingEditor', [
        'WordmatchingUtil',
        function(WordmatchingUtil){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/editor/wordmatching.html?v='+window.currentJsVersion,
                link:function($scope,$element){
                    $scope.prepareQuestion=function(){
                        if(!$scope.question.wordmatchingInputs){
                            WordmatchingUtil.prepareForDisplayEditor($scope.question);
                        }
                    };
                }
            }
        }
    ]);
}());

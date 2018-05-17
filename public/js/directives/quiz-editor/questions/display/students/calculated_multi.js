(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayCalculatedmultiStudent', [
        '$timeout',
        function($timeout){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/students/multiple_choice.html',
                controller:function($scope,$element){
                    var question = $scope.question;
                    $scope.$watch('question.attemptedanswers',function(choiceIndex){
                        if(!choiceIndex) return;
                        var response= {
                            setIndex:question.extra.setIndex,
                            answer:question.options[choiceIndex].order
                        }
                        $scope.sendResponse(response,question);
                    })

                }
            }
        }
    ])

}());

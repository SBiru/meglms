(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayCalculatedsimpleStudent', [
        '$timeout',
        function($timeout){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/students/calculated_simple.html',
                controller:function($scope,$element){
                    var question = $scope.question;
                    $scope.keyHasBeenPressed = function(){
                        if (question.typingTimeout) $timeout.cancel(question.typingTimeout);
                        question.typingTimeout = $timeout(function() {
                            var response= {
                                'setIndex':question.extra.setIndex,
                                answer:question.text
                            }
                            $scope.sendResponse(response,question);
                        }, 1000);
                    }

                }
            }
        }
    ])

}());

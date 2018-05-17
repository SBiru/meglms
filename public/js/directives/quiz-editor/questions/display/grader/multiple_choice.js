(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displaySimpleGrader', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/grader/multiple_choice.html',
                controller:function($scope) {
                    var question = $scope.question
                    $scope.prepareQuestion = function () {
                    };
                    $scope.selectOptionDisplayClass = function (option) {
                        if(!$scope.graderView) return '';
                        if(isStudentAnswer(option)){
                            return question.isCorrect?'correct':'incorrect';
                        }else if(isCorrectOption(option)){
                            return 'correct';
                        }
                        return '';
                    }
                    function isCorrectOption(option){
                        return question.solution==option.order;
                    }

                    function isStudentAnswer(option) {
                        return question.response==option.order;
                    }
                    $scope.radioIconSrcUrl = function(option){
                        return isStudentAnswer(option)?'/public/img/radiobutton_selected.png':'/public/img/radiobutton_unselected.png';
                    }
                }
            }
        }
    ]);
}());

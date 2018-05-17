
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    var input_mathNum = 1;
    app.directive('displayEquationReview', [
        '$compile',
        function($compile){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/reviewAnswer/equation_type.html',
                link:function($scope,$element){
                    var input_mathId = '';
                    $scope.prepareQuestion = function(){
                        getMathField();
                    }
                    function getMathField(){
                        if(typeof $scope.question.answeredMath === "undefined")
                            $scope.question.answeredMath = 'Not Answered';
                        else{
                            input_mathId = 'mathText_'+input_mathNum;
                            //if($element.context.children[1].firstElementChild.setAttribute.ready()){
                            $element.context.lastElementChild.setAttribute('id',input_mathId);
                            input_mathNum++;
                            //}
                            var answerSpan = document.getElementById(input_mathId);
                            $scope.answerMathField = MQ.StaticMath(answerSpan);
                        }

                    }
                }
            }
        }
    ]);
}());

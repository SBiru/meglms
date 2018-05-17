
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    var input_mathNum = 1;
    app.directive('displayEquationGrader', [
        '$sce',
        function($sce){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/grader/equation_type.html',
                link:function($scope,$element){
                    $scope.staticEls = [];
                    var hiddenElId = "eqGrader-static-hidden";
                    var solunElId = 'eqGrader-static-math-';
                    $scope.prepareQuestion = function(){
                        $scope.question.extra = typeof $scope.question.extra =='object'?$scope.question.extra:JSON.parse($scope.question.extra);
                        getAnswerMathEquation();
                        if($scope.question.extra.gradeType == 'automatic' && $scope.question.extra.solutions.length>0){
                            for(var index in $scope.question.extra.solutions){
                                $scope.staticEls.push(jQuery.extend(true, {},$scope.createStaticMathfield($scope.question.extra.solutions[index]).el()));
                            }
                        }
                        document.getElementById(hiddenElId).setAttribute("style","display:none;");
                    };

                    function getAnswerMathEquation(){
                        if(typeof $scope.question.response === "undefined")
                            $scope.question.response = 'No Answer given by Student';
                        else{
                            var answerSpan = document.getElementById("eqGrader-answer");
                            $scope.answerMathField = MQ.StaticMath(answerSpan);
                        }
                    }

                    $scope.createStaticMathfield = function(expr) {
                        document.getElementById(hiddenElId).innerHTML = expr;
                        return  MQ.StaticMath(document.getElementById(hiddenElId));
                    }

                    $scope.getMathEl = function(solunIndex){
                        if($scope.staticEls.length>0){
                            //var classes = document.getElementById(hiddenElId).getAttribute("class");
                            document.getElementById(solunElId + solunIndex).setAttribute("class", "mq-math-mode");
                            //$(hiddenElId).hide();
                            return $sce.trustAsHtml($scope.staticEls[solunIndex].innerHTML) ;
                        }
                    }

                    /*$("#eqGrader-static-math-0").on("ready",function () {
                        MQ.StaticMath(document.getElementById("eqGrader-static-math-0"));
                    });

                    function getSolutionsAsEquation(){
                     for (var index in $scope.question.extra.solutions){
                         var solunEl = document.getElementById("eqGrader-static-math-"+index);
                         $scope.answerMathField = MQ.StaticMath(solunEl);
                     }
                    }*/
                }
            }
        }
    ]);
}());

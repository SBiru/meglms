(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch (err) {
        app = angular.module('app');
    }
    var eqNum = 0;
    app.directive('displayEquationEditor', [
        '$sce',
        function ($sce) {
            return {
                restrict: 'E',
                scope: false,
                templateUrl: '/public/views/directives/quiz-editor/questions/display/editor/equation_type.html',
                link: function ($scope, $element) {
                    $scope.staticEls = [];
                    $scope.dirCount = eqNum;
                    eqNum++;
                    var currentSolunLength;
                    var hiddenElId = "eqEditor-static-hidden-" + $scope.dirCount;
                    var solunElId = 'eqEditor-static-math-' + $scope.dirCount + '-';
                    $scope.prepareQuestion = function () {
                        $scope.question.extra = typeof $scope.question.extra == 'object' ? $scope.question.extra : JSON.parse($scope.question.extra);
                        if ($scope.question.extra.gradeType == 'automatic' && $scope.question.extra.solutions) {
                            currentSolunLength = $scope.question.extra.solutions;
                            angular.forEach($scope.question.extra.solutions, function (solution) {
                                $scope.staticEls.push(jQuery.extend(true, {}, createStaticMathfield(solution).el()));
                            });
                        }
                        //document.getElementById(hiddenElId).style.display = "none";
                        document.getElementById(hiddenElId).innerHTML = "";
                    };

                    function createStaticMathfield (expr) {
                        document.getElementById(hiddenElId).innerHTML = expr;
                        return MQ.StaticMath(document.getElementById(hiddenElId));
                    }

                    $scope.getMathEl = function (solunIndex) {
                        if(currentSolunLength != $scope.question.extra.solutions){
                            $scope.staticEls = [];
                            angular.forEach($scope.question.extra.solutions, function (solution) {
                                $scope.staticEls.push(jQuery.extend(true, {}, createStaticMathfield(solution).el()));
                            });
                            currentSolunLength = $scope.question.extra.solutions;
                            document.getElementById(hiddenElId).innerHTML = "";

                        }
                        if ($scope.staticEls.length > 0) {
                            document.getElementById(solunElId + solunIndex).setAttribute("class", "mq-math-mode");
                            return $sce.trustAsHtml($scope.staticEls[solunIndex].innerHTML);
                        }
                    };

                    $scope.issetResponseItem = function (responseItem) {
                        return (responseItem == _.find($scope.question.extra.responseItems, function (item) {
                            return item == responseItem
                        }));
                    }
                }
            }
        }
    ]);
}());

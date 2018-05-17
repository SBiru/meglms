(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch (err) {
        app = angular.module('app');
    }
    var input_mathNum = 1;
    app.directive('displayEquationStudent', [
        function () {
            return {
                restrict: 'E',
                scope: false,
                templateUrl: '/public/views/directives/quiz-editor/questions/display/students/equation_type.html',
                controller: function ($scope, $element) {
                    var question = $scope.question;
                    $scope.undoStack = [];
                    $scope.redoStack = [];
                    $scope.enteredMath = '';
                    var input_mathId = '';
                    var answerMathField;
                    question.prepareQuestion = function () {
                        question.extra = typeof question.extra == 'object' ? question.extra : JSON.parse(question.extra);
                        getMathField();
                    };
                    function getMathField() {
                        input_mathId = 'mathText_' + input_mathNum;
                        $element.context.children[1].firstElementChild.setAttribute('id', input_mathId);
                        input_mathNum++;
                        var answerSpan = document.getElementById(input_mathId);
                        answerMathField = MQ.MathField(answerSpan, {
                            handlers: {
                                edit: function () {
                                    setUndoRedo();
                                    question.answeredMath = $scope.enteredMath = answerMathField.latex(); // Get entered math in LaTeX format
                                    $scope.$parent.$eval('sendResponse')($scope.enteredMath, question);
                                    answerMathField.focus();
                                }
                            }
                        });
                        answerMathField.__controller.container.keydown(function () {
                            if (isNaN(event.key) ? (question.extra.variables.indexOf(event.key) < 0) : false) {
                                return false;
                            }
                        });
                    }

                    function setUndoRedo() {
                        if ($scope.enteredMath != answerMathField.latex() && !$(':focus').hasClass("eq-nav-button")) {
                            $scope.redoStack = [];
                            $scope.undoStack.push($scope.enteredMath);
                        }
                    }

                    $scope.issetResponseItem = function (responseItem) {
                        return (responseItem == _.find(question.extra.responseItems, function (item) {
                            return item == responseItem
                        }));
                    };

                    $scope.buttonOperation = function (buttonValue) {
                        switch (buttonValue) {
                            //operators
                            case '+' :
                                answerMathField.write(buttonValue);
                                break;
                            case '-' :
                                answerMathField.write(buttonValue);
                                break;
                            case '×' :
                                answerMathField.cmd('\\times');
                                break;
                            case '.' :
                                answerMathField.cmd('\\bullet');
                                break;
                            case '÷' :
                                answerMathField.cmd('\\div');
                                break;
                            //logical operators
                            case '<' :
                                answerMathField.cmd('\\lt');
                                break;
                            case '>' :
                                answerMathField.cmd('\\gt');
                                break;
                            case '≤' :
                                answerMathField.cmd('\\le');
                                break;
                            case '≥' :
                                answerMathField.cmd('\\ge');
                                break;
                            case '=' :
                                answerMathField.write(buttonValue);
                                break;
                            //special symbols
                            case 'eq-special-fraction' :
                                answerMathField.cmd('\\frac');
                                break;
                            case 'eq-special-exponent' :
                                answerMathField.cmd('^');
                                break;
                            case 'eq-special-bracket' :
                                answerMathField.cmd('(');
                                answerMathField.cmd(')');
                                answerMathField.keystroke('Left');
                                break;
                            case '||' :
                                answerMathField.cmd('|');
                                answerMathField.cmd('|');
                                answerMathField.keystroke('Left');
                                break;
                            case 'eq-special-sqrt' :
                                answerMathField.cmd('\\sqrt');
                                break;
                            case 'eq-special-nthroot' :
                                answerMathField.cmd('\\nthroot');
                                break;
                            case 'eq-special-pi' :
                                answerMathField.cmd('\\pi');
                                break;
                            case 'eq-special-subscript' :
                                answerMathField.cmd('_');
                                break;
                            //navigation buttons
                            case 'left' :
                                answerMathField.keystroke('Left');
                                answerMathField.focus();
                                break;
                            case 'right' :
                                answerMathField.keystroke('Right');
                                answerMathField.focus();
                                break;
                            case 'backspace' :
                                if ($scope.enteredMath != '') {
                                    $scope.redoStack = [];
                                    $scope.undoStack.push(answerMathField.latex());
                                    answerMathField.keystroke('Backspace');
                                }
                                break;
                            default :
                                answerMathField.write(buttonValue);
                        }
                    };
                    $scope.undo = function () {
                        if ($scope.undoStack.length != 0) {
                            $scope.redoStack.push($scope.enteredMath);
                            answerMathField.latex($scope.undoStack.pop());
                        }
                    };

                    $scope.redo = function () {
                        if ($scope.redoStack.length != 0) {
                            $scope.undoStack.push($scope.enteredMath);
                            answerMathField.latex($scope.redoStack.pop());
                        }
                    };
                }
            }
        }
    ]);
}());
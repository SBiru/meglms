(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch (err) {
        app = angular.module('app');
    }
    var ERROR = {
        VAR_ALREADY_EXIST: 'Entered variable already exist. Please Enter another variable.',
        VAR_LENGTH : 'Variable length should not be more than one.',
        INVALID_SOLUTIONS_ITEMS : " contain(s) one or more response items ",
        INVALID_SOLUTIONS_VARIABLE : " contain(s) variable(s) ",
        INVALID_SOLUTIONS : " that hasn't been selected."
    };
    var INSTRUCTIONS = 'Equation Editor Question allows you to create a mathematical question into which the student will answer by forming equations or expressions using the buttons provided';
    app.directive('editEquationInModal', [
        '$sce',
        '$timeout',
        function ($sce, $timeout) {
            return {
                restrict: 'E',
                scope: {
                    question: '=?'
                },
                templateUrl: '/public/views/directives/quiz-editor/questions/create_or_edit/equation_type.html',
                link: function ($scope, $element) {
                    $scope.question.instructions = INSTRUCTIONS;
                    $scope.operators = ['+', '-', '×', '.', '÷'];
                    $scope.logicals = ['<', '>', '≤', '≥', '='];
                    $scope.specials = ['eq-special-fraction', 'eq-special-exponent', 'eq-special-subscript', 'eq-special-bracket', '||', 'eq-special-sqrt', 'eq-special-nthroot', 'eq-special-pi'];
                    var equivalent_latex={
                        operators : {"+" : "+", "-":"-", "×":"\\times",".":"\\bullet", "÷":"\\div"},
                        logicals : {"<":"<", ">":">", "≤":"\\le", "≥":"\\ge", "=":"="},
                        specials : {"eq-special-fraction":"\\frac", "eq-special-exponent":"^", "eq-special-bracket":"(", "||":"|", "eq-special-sqrt":"\\sqrt", "eq-special-nthroot":"\\sqrt[", "eq-special-pi":"\\pi","eq-special-subscript":"_"}
                    };
                    $scope.equation = {
                        responseItems: ['tools', 'numbers'],
                        variables: [],
                        operators: [],
                        logicals: [],
                        specials: [],
                        solutions: [],
                        solun_varriablesUsed : []
                    };
                    var variablesUsed = {};
                    var unselectedItems = {
                        operators: [],
                        logicals: [],
                        specials: []
                    };
                    $scope.staticEls = [];
                    $scope.equation.gradeType = 'manual';
                    $scope.variable = '';
                    $scope.undoStack = [];
                    $scope.redoStack = [];
                    $scope.isEditing = false;
                    $scope.errors = {variableErrors: []};
                    $scope.solunErrorsItems = '';
                    $scope.solunErrorsVariables = '';
                    $scope.enteredMath = '';
                    var answerMathField;

                    $scope.question.canSave = function () {
                        if($scope.equation.gradeType == 'automatic')
                            return !($scope.solunErrorsItems != '' || $scope.solunErrorsVariables != '');
                        return true;
                    };
                    $scope.question.prepareQuestion = function () {
                        $scope.question.extra = {
                            responseItems: $scope.equation.responseItems
                        };
                        angular.forEach($scope.equation.responseItems, function (responseItem) {
                            switch (responseItem) {
                                case 'variables' :
                                    $scope.question.extra.variables = $scope.equation.variables;
                                    break;
                                case 'operators' :
                                    $scope.question.extra.operators = $scope.equation.operators;
                                    break;
                                case 'logicals' :
                                    $scope.question.extra.logicals = $scope.equation.logicals;
                                    break;
                                case 'specials' :
                                    $scope.question.extra.specials = $scope.equation.specials;
                                    break;
                            }
                        });
                        $scope.question.extra.gradeType = $scope.equation.gradeType;
                        if ($scope.question.extra.gradeType == 'automatic') {
                            $scope.question.extra.solutions = $scope.equation.solutions;
                            $scope.question.extra.solun_varriablesUsed = $scope.equation.solun_varriablesUsed;
                        }
                    };

                    $scope.question.prepareBeforeEdit = function () {
                        var equationPreferences= JSON.parse(JSON.stringify(typeof $scope.question.extra == 'object' ? $scope.question.extra : JSON.parse($scope.question.extra)));
                        $scope.equation.responseItems = equationPreferences.responseItems;
                        if(equationPreferences.variables){
                            $scope.equation.variables = equationPreferences.variables;
                            resetVariablesUsed();
                        }
                        if(equationPreferences.operators)
                            $scope.equation.operators = equationPreferences.operators;
                        if(equationPreferences.logicals)
                            $scope.equation.logicals = equationPreferences.logicals;
                        if(equationPreferences.specials)
                            $scope.equation.specials = equationPreferences.specials;
                        getUnselectedItems();
                        $scope.equation.gradeType = equationPreferences.gradeType;
                        if(equationPreferences.gradeType == 'automatic') {
                            $scope.equation.solutions = equationPreferences.solutions;
                            $scope.equation.solun_varriablesUsed = equationPreferences.solun_varriablesUsed;
                            setSavedSolutions();
                        }
                    };

                    function resetVariablesUsed(){
                        variablesUsed = {};
                        if($scope.issetResponseItem("variables")){
                            angular.forEach($scope.equation.variables,function (variable) {
                                variablesUsed[variable] = 0;
                            });
                        }
                    }
                    function setSavedSolutions() {
                        $timeout(function () {
                            $scope.staticEls =[];
                            angular.forEach($scope.equation.solutions, function (solution) {
                            $scope.staticEls.push(jQuery.extend(true, {}, createStaticMathfield(solution).el()));
                        });
                    },100);
                    }

                    $scope.issetResponseItem = function (responseItem) {
                        return !($scope.equation.responseItems.indexOf(responseItem) < 0);
                    };

                    $scope.issetValue = function (itemArray, value) {
                        return !(itemArray.indexOf(value) < 0);
                    };

                    $scope.addValueToArray = function (itemArray, value) {
                        if ($scope.issetValue(itemArray, value)) {
                            itemArray.splice(itemArray.indexOf(value), 1);
                        } else {
                            if (value == '.') {
                                if ($scope.issetValue(itemArray, '×'))
                                    itemArray.splice(itemArray.indexOf('×'), 1);
                            }
                            if (value == '×') {
                                if ($scope.issetValue(itemArray, '.'))
                                    itemArray.splice(itemArray.indexOf('.'), 1);
                            }
                            itemArray.push(value);
                        }
                        getUnselectedItems();
                        updateSolunVariablesUsed();
                    };
                    function getUnselectedItems() {
                        if($scope.issetResponseItem('operators'))
                            unselectedItems.operators = $scope.operators.diff($scope.equation.operators);
                        else
                            unselectedItems.operators = $scope.operators;
                        if($scope.issetResponseItem('logicals'))
                            unselectedItems.logicals = $scope.logicals.diff($scope.equation.logicals);
                        else
                            unselectedItems.logicals = $scope.logicals;
                        if($scope.issetResponseItem('specials'))
                            unselectedItems.specials = $scope.specials.diff($scope.equation.specials);
                        else
                            unselectedItems.specials = $scope.specials;
                    }

                    function updateSolunVariablesUsed(action, variable){
                        if($scope.issetResponseItem('variables')){
                            switch (action){
                                case 'add' :
                                    if(variablesUsed[variable] == undefined)
                                        variablesUsed[variable] = 0;
                                    angular.forEach($scope.equation.solun_varriablesUsed,function (solu_variablesUsed) {
                                        if(solu_variablesUsed[variable] == undefined)
                                            solu_variablesUsed[variable] = 0;
                                    });
                                    break;
                                case 'delete' :
                                    angular.forEach($scope.equation.solun_varriablesUsed,function (solu_variablesUsed) {
                                        if(solu_variablesUsed[variable] == 0)
                                            delete solu_variablesUsed[variable];
                                    });
                                    if(variablesUsed[variable] <= 0)
                                        delete variablesUsed[variable];
                                    break;
                            }

                        }else{
                            angular.forEach($scope.equation.solun_varriablesUsed,function (solu_variablesUsed) {
                                angular.forEach($scope.equation.variables,function (variable) {
                                    if(solu_variablesUsed[variable] == 0)
                                        delete solu_variablesUsed[variable];
                                    if(variablesUsed[variable] == 0)
                                        delete variablesUsed[variable];
                                });
                            });
                        }

                    }

                    Array.prototype.diff = function(a) {
                        return this.filter(function(i) {return a.indexOf(i) < 0;});
                    };
                /*Solutions Validation for variables and items*/
                    var invalidSolunItems = [];
                    function isInvalidSolution(expr){
                        var bool = false;
                        invalidSolunItems = [];
                        var itemType;
                        for(itemType in unselectedItems) {
                            var i=0;
                            while (i<unselectedItems[itemType].length){
                                //console.log(equivalent_latex[itemType][unselectedItems[itemType][i]]);

                                if(equivalent_latex[itemType][unselectedItems[itemType][i]] == '\\le'){ //for '<=' (\le) [ to differentiate between '\le' and '\left']
                                    var leCount = expr.split('\\le').length - 1;
                                    var leftCount = expr.split('\\left').length -1;
                                    bool = (leCount-leftCount) > 0;
                                }else{
                                    bool = expr.includes(equivalent_latex[itemType][unselectedItems[itemType][i]]);
                                }
                                if(bool){
                                    return bool;
                                }
                                i++;
                            }
                        }
                        return bool;
                    }

                    $scope.validateSolutionsWithItems = function() {
                        if($scope.equation.gradeType == 'automatic'){
                            var i=0;
                            $scope.solunErrorsItems = '';
                            while(i<$scope.equation.solutions.length){
                                if(isInvalidSolution($scope.equation.solutions[i])){
                                    $scope.solunErrorsItems = $scope.solunErrorsItems + ' SOLUTION' + (i+1)+',';
                                }
                                i++;
                            }
                            if($scope.solunErrorsItems !=''){
                                $scope.solunErrorsItems = $scope.solunErrorsItems.slice(0,-1);
                                $scope.solunErrorsItems = $scope.solunErrorsItems + ERROR['INVALID_SOLUTIONS_ITEMS'] +  ERROR['INVALID_SOLUTIONS'];
                            }
                            return $scope.solunErrorsItems != '';
                        }
                    };
                    $scope.validateSolutionsWithVariables = function () {
                        if($scope.equation.gradeType == 'automatic'){
                            var i=0;
                            var variables = $scope.issetResponseItem("variables")? $scope.equation.variables : [];
                            $scope.solunErrorsVariables = '';
                            var invalidVars = [];
                            while (i<$scope.equation.solun_varriablesUsed.length){
                                var variableUsed;
                                for(variableUsed in $scope.equation.solun_varriablesUsed[i]){
                                    if($scope.equation.solun_varriablesUsed[i].hasOwnProperty(variableUsed)  && !$scope.issetValue(variables,variableUsed)){
                                        if(!$scope.solunErrorsVariables.includes('SOLUTION' +(i+1)))
                                            $scope.solunErrorsVariables +=  ' SOLUTION' + (i+1)+',';
                                        if(!$scope.issetValue(invalidVars,variableUsed))
                                            invalidVars.push(variableUsed);
                                    }
                                }
                                i++;
                            }
                            if($scope.solunErrorsVariables !=''){
                                $scope.solunErrorsVariables = $scope.solunErrorsVariables.slice(0,-1);
                                $scope.solunErrorsVariables += ERROR['INVALID_SOLUTIONS_VARIABLE'] + invalidVars.toString() +  ERROR['INVALID_SOLUTIONS'];
                            }
                            return $scope.solunErrorsVariables != '';
                        }
                    };
                    String.prototype.replaceAll = function(search, replacement) {
                        var target = this;
                        return target.replace(new RegExp(search, 'g'), replacement);
                    };
                    function getDifference(str1, str2){
                        var i = 0;
                        var j = 0;
                        str1 = str1.replaceAll("{","");
                        str1 = str1.replaceAll("}","");
                        str1 = str1.replaceAll(" ","");
                        str2 = str2.replaceAll("}","");
                        str2 = str2.replaceAll("{","");
                        str2 = str2.replaceAll(" ","");
                        var a,b;
                        if(str1.length>str2.length){
                            a = str2;
                            b = str1;
                        }else{
                            a = str1;
                            b = str2;
                        }
                        var result = "";
                        while (j < b.length)
                        {
                            if ((a[i] != b[j] || i == a.length)) {
                                result += b[j];
                            }

                            else
                                i++;
                            j++;
                        }
                        return result;
                    }
                    function showLocalError() {
                        $timeout(function () {
                            $('#eq-variable-error-0').fadeTo(2000, 0);
                            $timeout(function () {
                                $scope.errors.variableErrors.splice(0, 1);
                            }, 2000);
                        }, 2000);
                           /* $timeout(function () {
                                $scope.errors.variableErrors.splice(0, 1);
                            }, 2000)*/
                    }

                /*For entering variables*/
                    $scope.addVariable = function () {
                        if ($scope.issetValue($scope.equation.variables, $scope.variable)) {
                            $scope.errors.variableErrors.push(ERROR.VAR_ALREADY_EXIST);
                            showLocalError();
                        }else if($scope.variable.length>1){
                            $scope.errors.variableErrors.push(ERROR.VAR_LENGTH);
                            showLocalError();
                        } else {
                            $scope.equation.variables.push($scope.variable);
                            updateSolunVariablesUsed('add',$scope.variable);
                            $scope.variable = '';
                            $scope.errors.variableErrors = [];
                        }
                        $(':focus').prev().focus();
                    };

                    $scope.removeVariable = function (index) {
                        updateSolunVariablesUsed('delete',$scope.equation.variables[index]);
                        $scope.equation.variables.splice(index, 1);
                    };

                    $("#eq-var-input").keypress(function () {
                        if(!(event.which>=65 && event.which<=90) && !(event.which>=97 && event.which<=122))
                            return false;
                    });

                /* FOR ENTERING THE SOLUTIONS*/
                    $scope.getMathEl = function (solunIndex) {
                        if ($scope.staticEls.length > 0) {
                            var classes = document.getElementById("eq-static-hidden").getAttribute("class");
                            document.getElementById('static-math-' + solunIndex).setAttribute("class", "mq-math-mode");
                            //console.log($scope.staticEls[solunIndex].innerHTML);
                            return $sce.trustAsHtml($scope.staticEls[solunIndex].innerHTML);
                        }
                    };

                    function createStaticMathfield(expr) {
                        document.getElementById("eq-static-hidden").style.display = "";
                        document.getElementById("eq-static-hidden").innerHTML = expr;
                        var staticMathField =  MQ.StaticMath(document.getElementById("eq-static-hidden"));
                        document.getElementById("eq-static-hidden").style.display = "none";
                        return staticMathField;
                    }
                    function updateVariablesUsed(){
                        var variableUsed;
                        for (variableUsed in variablesUsed){
                            if(variablesUsed.hasOwnProperty(variableUsed) && !$scope.issetValue($scope.equation.variables,variableUsed)){
                                if(variablesUsed[variableUsed] <= 0)
                                    delete variablesUsed[variableUsed];
                            }
                        }
                    }
                    $scope.saveSolution = function () {
                        if ($scope.enteredMath != '') {
                            $scope.equation.solutions.push($scope.enteredMath);
                            //$("#eq-static-hidden").removeAttr("hidden");
                            $scope.staticEls.push(jQuery.extend(true, {}, createStaticMathfield($scope.enteredMath).el()));
                            resetAnswerMathField();
                            updateVariablesUsed();
                            $scope.equation.solun_varriablesUsed.push(angular.copy(variablesUsed));
                            resetVariablesUsed();
                        }
                    };

                    $scope.removeSolution = function (index) {
                        //$('static-math-'+index).remove();
                        $scope.equation.solutions.splice(index, 1);
                        $scope.staticEls.splice(index, 1);
                        $scope.equation.solun_varriablesUsed.splice(index,1);
                    };

                    var currentEditingIndex = -1;
                    $scope.getCurrentIndex = function () {
                        return currentEditingIndex;
                    };
                    $scope.editSolution = function (index) {
                        if ($scope.isEditing) {
                            if (index != currentEditingIndex)
                                $scope.equation.solutions[currentEditingIndex] = $scope.enteredMath;
                            $scope.staticEls[currentEditingIndex] = jQuery.extend(true, {}, createStaticMathfield($scope.enteredMath).el());
                            resetAnswerMathField();
                            updateVariablesUsed();
                            $scope.equation.solun_varriablesUsed[currentEditingIndex] = angular.copy(variablesUsed);
                            resetVariablesUsed();
                            $scope.isEditing = false;
                            currentEditingIndex = -1;
                        } else {
                            resetAnswerMathField();
                            currentEditingIndex = index;
                            variablesUsed = angular.copy($scope.equation.solun_varriablesUsed[currentEditingIndex]);
                            answerMathField.latex($scope.equation.solutions[currentEditingIndex]);
                            $scope.undoStack =[];
                            $scope.isEditing = true;
                        }
                    };

                    $scope.cancelEditingSolution = function () {
                        resetAnswerMathField();
                        resetVariablesUsed();
                        $scope.isEditing = false;
                        currentEditingIndex = -1;
                    };

                /*editable mathfield*/
                    var answerSpan;
                    $scope.$watch(answerSpan = document.getElementById('eq-editable-math'), function () {
                        if (answerSpan) {
                            createMathField();
                        }
                    });

                    function createMathField() {
                        answerMathField = MQ.MathField(answerSpan, {
                            handlers: {
                                edit: function () {
                                    setUndoRedo();
                                    var prevValue = $scope.enteredMath;
                                    $scope.enteredMath = answerMathField.latex(); // Get entered math in LaTeX format
                                    answerMathField.blur();
                                    $timeout(function () {
                                        answerMathField.focus();
                                    });
                                    var changedValue = getDifference($scope.enteredMath,prevValue);
                                    if($scope.issetValue($scope.equation.variables, changedValue) || variablesUsed[changedValue]!=undefined){
                                        if($scope.enteredMath.split(changedValue).length>prevValue.split(changedValue).length)
                                            variablesUsed[changedValue]++;
                                        else
                                            variablesUsed[changedValue]--;
                                    }
                                }
                            }
                        });
                        answerMathField.__controller.container.off("keydown");
                        answerMathField.__controller.container.keydown(function () {
                            if(event.which == 8){
                                return false;
                            }
                            if(isNaN(event.key)? !$scope.issetValue($scope.equation.variables, event.key):false){
                                return false;
                            }
                        });
                    }

                    function resetAnswerMathField() {
                        $scope.enteredMath = '';
                        $scope.undoStack = [];
                        $scope.redoStack = [];
                        answerMathField.latex('');
                    }

                    function setUndoRedo() {
                        if($scope.enteredMath != answerMathField.latex() && !$(':focus').hasClass("eq-nav-button")){
                            $scope.redoStack = [];
                            $scope.undoStack.push($scope.enteredMath);
                        }
                    }
                /*For the Keypad Functionalities*/
                    $scope.buttonOperation = function (buttonValue) {
                        switch(buttonValue){
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
                                if($scope.enteredMath != ''){
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
                            $scope.redoStack.push(answerMathField.latex());
                            answerMathField.latex($scope.undoStack.pop());
                        }
                    };

                    $scope.redo = function () {
                        if ($scope.redoStack.length != 0) {
                            $scope.undoStack.push(answerMathField.latex());
                            answerMathField.latex($scope.redoStack.pop());
                        }
                    };
                }
            }
        }
    ]);
}());
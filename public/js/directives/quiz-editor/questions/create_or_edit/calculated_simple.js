//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    var ERROR = {
        PARAM_NOT_SET: 'Click on "Validate and find parameters"',
        EMPTY_SETS: "Must generate at least on set of parameters",
        EMPTY_FORMULA: "Correct answer formula must not be empty",
    }
    var INSTRUCTIONS = 'Simple calculated question gives you the option of including numerical formula results using parameters in curly brackets. On the quiz, the parameters will be replaced by individual values in the question prompt and the student will input the final result. The student\'s answer will be compared to the correct answer formula you defined. Ex: "What is the total number of legs in a farm with {c} chickens and {h} horses?". The correct answer would be "{c}*2 + {h}*4" (where * denotes multiplication).';
    app.directive('editCalculatedsimpleInModal', [
        'CalculatedSimpleService',
        function(CalculatedSimpleService){
            return {
                restrict:'E',
                scope:{
                    question:'=?'
                },
                templateUrl:'/public/views/directives/quiz-editor/questions/create_or_edit/calculated_simple.html',
                link:function($scope){
                    $scope.question.instructions = INSTRUCTIONS;
                    $scope.question.prepareQuestion = function(){

                        $scope.question.extra = {
                            options:$scope.calculatedSimple,
                            sets: _.map($scope.sets,function(set_){
                                return {
                                    answer:set_.answer,
                                    params:set_.params,
                                    range:set_.range,
                                    formula:set_.formula
                                }
                            }),
                            params:$scope.parameters
                        }
                    };
                    $scope.question.prepareBeforeEdit = function(){
                        if($scope.question.extra){
                            var questionOptions = typeof $scope.question.extra =='object'?$scope.question.extra:JSON.parse($scope.question.extra);
                            $scope.parameters = questionOptions.params;
                            $scope.calculatedSimple = questionOptions.options;
                            $scope.sets = _.map(questionOptions.sets,function(set_){
                                set_.isValid = true;
                                return set_;
                            });
                        }
                    };
                    $scope.loading = $scope.loading|| {};
                    $scope.calculatedSimple = angular.extend({},createDefaults(),$scope.calculatedSimple);
                    $scope.that = {
                        display:1
                    }

                    function createDefaults(){
                        return{
                            tolerance:0.1,
                            toleranceType:'relative',
                            decimals:2,
                            decimalsType:'decimal',
                            numberOfSets:1
                        }
                    }

                    $scope.validateAndFind = function(){
                        $scope.loading.validate = true;
                        $scope.sets = [];
                        CalculatedSimpleService.validateAndFind({
                            formula:$scope.calculatedSimple.formula
                        },function(parameters){
                            $scope.parameters = _.map(parameters,function(param){
                                var paramDefaults = createParamDefaults();
                                paramDefaults['param']=fixParam(param);
                                return paramDefaults
                            });
                            $scope.loading.validate = false;
                        },handleError.bind(null,'validate'))
                    }
                    function fixParam(param){
                        var r = '';
                        for(var i in param){
                            if(typeof param[i]==='string')
                                r+=param[i];
                            else break;
                        }
                        return r;
                    }
                    $scope.generateSets = function($event){
                        $scope.sets=[]
                        var request = angular.copy($scope.calculatedSimple);
                        request['params']=JSON.stringify($scope.parameters);
                        $scope.loading.generatingSets=true;
                        CalculatedSimpleService.generateSets(request,function(sets){
                            $scope.sets = sets;
                        },handleError.bind(null,'generatingSets'));
                        $scope.stopPropagation($event);
                    }
                    function handleError(feature,error){
                        $scope.loading[feature] = false;
                        if(error.data.showToUser){
                            toastr.error(error.data.error)
                        }else{
                            toastr.error('Something went wrong');
                        }
                    }
                    function createParamDefaults(){
                        return {
                            min:0.1,
                            max:10,
                            decimals:2
                        }
                    }
                    $scope.canValidate = function(){
                        return !$scope.loading.validate && $scope.calculatedSimple.formula
                    }
                    $scope.shouldShowWildCardParameters = function(){
                        if(!($scope.parameters && $scope.parameters.length)){
                            $scope.question.error = $scope.question.error || ERROR.PARAM_NOT_SET ;
                            return false;
                        }
                        return true ;

                    }
                    $scope.shouldShowWildCardValues = function(){
                        if(!($scope.sets && $scope.sets.length)){
                            $scope.question.error = $scope.question.error || ERROR.EMPTY_SETS ;
                            return false;
                        }
                        return true ;
                    }
                    $scope.isFormulaEmpty = function(){
                        if(!$scope.calculatedSimple.formula){
                            $scope.question.error = $scope.question.error ||  ERROR.EMPTY_FORMULA;
                            return true;
                        }
                        return false;
                    }
                    $scope.stopPropagation = function($event){
                        $event.stopPropagation();
                    }
                    $scope.question.canSave = function (){
                        $scope.question.error = isLocalError()?'':$scope.question.error;
                        return  !$scope.isFormulaEmpty()&&
                                $scope.shouldShowWildCardParameters() &&
                                $scope.shouldShowWildCardValues() &&
                                !$scope.setsHaveError()

                    }
                    function isLocalError(){
                        if(!$scope.question.error) return true;
                        for(e in ERROR){
                            if(ERROR[e]==$scope.question.error)
                                return true;
                        }
                        return false;
                    }
                    $scope.setsHaveError = function(){
                        for(var i = 0; i<$scope.sets.length;i++){
                            if(!$scope.sets[i].isValid) return true;
                        }
                        return false;
                    }
                    $scope.startEditingSet = function(set_){
                        set_.eParams = angular.copy(set_.params);
                        set_.editing=true;
                    }
                    $scope.stopEditingSet = function(set_){
                        delete set_.eParams;
                        set_.editing=false;
                    }
                    $scope.finishEditingSet = function(set_){
                        var request = angular.copy($scope.calculatedSimple);
                        request['set']=JSON.stringify(set_.eParams);
                        $scope.loading.calculatingSet=true;
                        CalculatedSimpleService.calculateSet(request,function(resp){
                            set_.answer = resp.answer;
                            set_.range = resp.range;
                            set_.isValid = resp.isValid;
                            set_.formula = resp.formula;
                            set_.error = resp.error;
                            set_.params = angular.copy(set_.eParams);
                            $scope.stopEditingSet(set_);
                        },handleError.bind(null,'calculatingSet'));
                    }
                    $scope.removeSet = function(index){
                        $scope.sets.splice(index,1);
                    }
                    $scope.$on('$destroy', function(){
                        $scope.question.error = null
                    });

                }
            }
        }
    ]).service('CalculatedSimpleService',['$resource',function($resource){
        var rootUrl = '/api/questions/calculated-simple';
        return $resource(rootUrl,{},{
            'validateAndFind':{
                url:rootUrl+'/validate',
                isArray:true

            },
            'generateSets':{
                url:rootUrl+'/generate',
                isArray:true
            }
            ,
            'calculateSet':{
                url:rootUrl+'/calculate'
            }
        })
    }]).directive('resizeTablesWhenChangeSet',['$timeout',
        function($timeout){
            return{
                restrict:'E',
                link:function(scope,element){
                    scope.$watch('sets',function(sets){
                        if(sets){
                            if(scope.isTableDataLoaded=true)
                                transformTable()
                        }
                    },true)
                    scope.$watch(tableDataLoaded, function(isTableDataLoaded) {
                        if (isTableDataLoaded) {
                            scope.isTableDataLoaded=true;
                            transformTable();
                        }
                    });

                    function tableDataLoaded() {
                        if(!element.find('table').length || element.css('display')=='none') return;
                        var elem = element.find('table')[0];
                        var firstCell = elem.querySelector('tbody tr:first-child td:first-child');
                        return firstCell && !firstCell.style.width;
                    }
                    function transformTable() {
                        var tables = element.find('table');
                        $timeout(function(){
                            setTablesHeight(tables,findMaxHeight(tables));
                        },500);

                    }
                    function findMaxHeight(tables){
                        var maxHeight =80;
                        angular.element(tables).each(function(i,table){
                            maxHeight = Math.max(angular.element(table).height(),maxHeight);
                        })
                        return maxHeight;
                    }
                    function setTablesHeight(tables,height){
                        angular.element(tables).each(function(i,table){
                            angular.element(table).css('height',height+'px');
                        })
                    }
                }
            }
        }
    ]);
}());

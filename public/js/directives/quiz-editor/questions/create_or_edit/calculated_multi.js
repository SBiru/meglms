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
        NO_SOLUTION: "Select one of the choices to be the correct answer",
        INVALID_CHOICE_COUNT: "Question must have at least two valid choices",
    }
    var INSTRUCTIONS = 'Multiple choice calculated question gives you the option of including numerical formula results using parameters in curly brackets. On the quiz, the parameters will be replaced by individual values in the question prompt and question choices. Ex: "What is the total number of legs in a farm with {c} chickens and {h} horses?". The correct answer would be "{={c}*2 + {h}*4}" (where * denotes multiplication).';
    var NUMBER_OF_DEFAULT_CHOICES = 4;
    app.directive('editCalculatedmultiInModal', [
        'CalculatedMultiService',
        function(CalculatedMultiService){
            return {
                restrict:'E',
                scope:{
                    question:'=?'
                },
                templateUrl:'/public/views/directives/quiz-editor/questions/create_or_edit/calculated_multi.html',
                link:function(scope){
                    scope.question.instructions = INSTRUCTIONS;
                    scope.question.prepareQuestion = function(){

                        scope.question.extra = {
                            options: scope.calculatedMulti,
                            sets:scope.sets,
                            params:scope.parameters
                        };
                        scope.question.solution = scope.calculatedMulti.solution;
                        scope.question.options = _.filter(_.map(scope.calculatedMulti.choices,function(choice){
                            return choice.formula;
                        }),function(option){
                            return option;
                        })

                    };
                    scope.question.prepareBeforeEdit = function(){
                        if(scope.question.extra){
                            var questionOptions = typeof scope.question.extra =='object'?scope.question.extra:JSON.parse(scope.question.extra);
                            scope.parameters = questionOptions.params;
                            scope.calculatedMulti = questionOptions.options;
                            scope.sets = _.map(questionOptions.sets,function(set_){
                                set_.isValid = true;
                                return set_;
                            });
                        }
                    };
                    scope.loading = scope.loading|| {};
                    scope.calculatedMulti = angular.extend({},createDefaults(),scope.calculatedMulti);
                    scope.that = {
                        display:1
                    }

                    function createDefaults(){
                        return{
                            numberOfSets:1,
                            choices: _.map(_.range(0,NUMBER_OF_DEFAULT_CHOICES),function(){return {
                                decimals:2,
                                decimalsType:'decimal',
                            }})
                        }
                    }

                    scope.validateAndFind = function($event){
                        scope.loading.validate = true;
                        scope.sets = [];
                        CalculatedMultiService.validateAndFind({
                            choices: _.filter(scope.calculatedMulti.choices,function(choice){return choice.formula})
                        },function(parameters){
                            scope.parameters = _.map(parameters,function(param){
                                var paramDefaults = createParamDefaults();
                                paramDefaults['param']=fixParam(param);
                                return paramDefaults
                            });
                            scope.loading.validate = false;
                        },handleError.bind(null,'validate'))
                        scope.stopPropagation($event);
                    }
                    function createParamDefaults(){
                        return {
                            min:0.1,
                            max:10,
                            decimals:2
                        }
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
                    function handleError(feature,error){
                        scope.loading[feature] = false;
                        if(error.data.showToUser){
                            toastr.error(error.data.error)
                        }else{
                            toastr.error('Something went wrong');
                        }
                    }
                    scope.generateSets = function($event){
                        scope.sets=[]
                        var request = angular.copy(scope.calculatedMulti);
                        request['params']=JSON.stringify(scope.parameters);
                        scope.loading.generatingSets=true;
                        CalculatedMultiService.generateSets(request,function(sets){
                            scope.sets = sets;
                        },handleError.bind(null,'generatingSets'));
                        scope.stopPropagation($event);
                    }

                    scope.shouldShowWildCardParameters = function(){
                        if(!(scope.parameters && scope.parameters.length)){
                            scope.error = scope.error || ERROR.PARAM_NOT_SET ;
                            return false;
                        }
                        return true ;
                    }
                    scope.shouldShowWildCardValues = function(){
                        if(!(scope.sets && scope.sets.length)){
                            scope.question.error = scope.question.error || ERROR.EMPTY_SETS ;
                            return false;
                        }
                        return true ;
                    }
                    scope.stopPropagation = function($event){
                        $event.stopPropagation();
                    }
                    scope.question.canSave = function (){
                        scope.question.error = isLocalError()?'':scope.question.error;
                        return  hasSolution() &&
                                isEmptyFormula() &&
                                hasMoreThanTwoChoices() &&
                                scope.shouldShowWildCardParameters() &&
                                scope.shouldShowWildCardValues() &&
                                !scope.setsHaveError()

                    }
                    function hasSolution(){
                        if(_.isUndefined(scope.calculatedMulti.solution)) {
                            scope.question.error = scope.question.error || ERROR.NO_SOLUTION;
                            return false;
                        }
                        return true ;
                    }
                    function isEmptyFormula(){
                        if(!(scope.calculatedMulti.choices[scope.calculatedMulti.solution] && scope.calculatedMulti.choices[scope.calculatedMulti.solution].formula)){
                            scope.question.error = scope.question.error || ERROR.EMPTY_FORMULA;
                            return false;
                        }
                        return true ;
                    }
                    function hasMoreThanTwoChoices(){
                        var validChoices = 0;
                        for(var i=0;i<scope.calculatedMulti.choices.length;i++){
                            if(scope.calculatedMulti.choices[i].formula)
                                validChoices++;
                            if(validChoices==2)
                                return true;
                        }
                        scope.question.error = scope.question.error || ERROR.INVALID_CHOICE_COUNT;
                        return false;
                    }

                    function isLocalError(){
                        if(!scope.question.error) return true;
                        for(e in ERROR){
                            if(ERROR[e]==scope.question.error)
                                return true;
                        }
                        return false;
                    }
                    scope.setsHaveError = function(){
                        for(var i = 0; i<scope.sets.length;i++){
                            if(!scope.sets[i].isValid) return true;
                        }
                        return false;
                    }
                    scope.startEditingSet = function(set_){
                        set_.eParams = angular.copy(set_.params);
                        set_.editing=true;
                    }
                    scope.stopEditingSet = function(set_){
                        delete set_.eParams;
                        set_.editing=false;
                    }
                    scope.finishEditingSet = function(set_){
                        var request = angular.copy(scope.calculatedMulti);
                        request['set']=JSON.stringify(set_.eParams);
                        scope.loading.calculatingSet=true;
                        CalculatedMultiService.calculateSet(request,function(resp){
                            set_.isValid = resp.isValid;
                            set_.choices = resp.choices;
                            set_.error = resp.error;
                            set_.params = angular.copy(set_.eParams);
                            scope.stopEditingSet(set_);
                        },handleError.bind(null,'calculatingSet'));
                    }
                    scope.removeSet = function(index){
                        scope.sets.splice(index,1);
                    }
                    scope.$on('$destroy', function(){
                        scope.question.error = null
                    });


                }
            }
        }
    ]).service('CalculatedMultiService',['$resource',function($resource){
        var rootUrl = '/api/questions/calculated-multi';
        return $resource(rootUrl,{},{
            'validateAndFind':{
                url:rootUrl+'/validate',
                method:'POST',
                isArray:true,
                transformResponse:function(data){
                    data = angular.fromJson(data);
                    var resp = [];
                    for(var i in data){
                        resp[i]=data[i];
                    }
                    return resp;
                }

            },
            'generateSets':{
                url:rootUrl+'/generate',
                method:'POST',
                isArray:true
            }
            ,
            'calculateSet':{
                method:'POST',
                url:rootUrl+'/calculate'

            }
        })
    }])
}());

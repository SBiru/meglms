(function () {
var app;
try {
    app = angular.module('app.testbank');
}
catch(err) {
    app = angular.module('app');
}
var INVALID_TYPE_MESSAGE = "Invalid question type";
    //types that still needs to move to its own directive
var NEEDING_REFACTORING_TYPES =['single','oneword','matching','blank','multiple','truefalse','wordmatching','studentvideoresponse','multipart','information','open'];
app.directive('editQuestionInModal', [
    '$compile',
    '$timeout',
    '$q',
    'TestbankQuestionService',
    function($compile,$timeout,$q,TestbankQuestionService){
        return {
            restrict:'E',
            scope:false,
            templateUrl:'/public/views/directives/quiz-editor/questions/create_or_edit/question.html',
            link:function($scope,$element,$attrs){
                $scope.type = getType();
                validateType();

                $scope.$watch(getType,function(type){
                    $scope.type = type;
                    if(type){
                        $scope.values.instructions=null;
                        selectQuestionDirective();
                    }
                })
                function getType() {
                    return $scope.$eval($attrs['type'])
                }
                function validateType(){
                    if(!TestbankQuestionService.questionTypes().hasOwnProperty($scope.type)){
                        toastr.error(INVALID_TYPE_MESSAGE);
                        throw INVALID_TYPE_MESSAGE;
                    }
                }
                var shouldDestroyScope;

                function selectQuestionDirective(){
                    var directive = directiveSuffix();
                    recompileInnerElement(directive);
                    shouldDestroyScope = hasInnerScope($scope.type)
                }

                function recompileInnerElement(directive){
                    deleteCurrentQuestionIfExists().then(function(){
                        var directiveEl = '<'+directive+' editing="" question="values">'+'</'+directive+'>';
                        var compiled = $compile(directiveEl)($scope);
                        $element.append(compiled);
                        initQuestion()
                    });
                }
                function deleteCurrentQuestionIfExists(){
                    var defer = $q.defer();
                    if($element.find('[editing=""]').length){
                        removeElementAndScope(defer)
                    }else{
                        defer.resolve();
                    }
                    return defer.promise;
                }
                function removeElementAndScope(defer){
                    if(shouldDestroyScope)
                        $timeout(function(){
                            $element.find('[editing]').isolateScope().$destroy();
                            $element.find('[editing]').remove();
                            defer.resolve()
                        })
                    else{
                        $element.find('[editing]').remove();
                        defer.resolve()
                    }
                }
                function directiveSuffix(){
                    var directive;
                    if(!hasInnerScope($scope.type)){
                        directive= 'edit-default-in-modal'
                    }
                    else{
                        directive= 'edit-'+$scope.type+'-in-modal'
                    }
                    return directive;
                }
                function initQuestion(){
                    if(isQuestionReady()){
                        $timeout(function(){
                            if($scope.question && $scope.question.prepareBeforeEdit)
                                $scope.question.prepareBeforeEdit();
                        },500)

                    }
                    else{
                        $timeout(function(){
                            initQuestion()
                        },500);
                    }

                }
                function isQuestionReady(){
                    return $element.find('[editing=""]').length;
                }
                function hasInnerScope(type){
                    return NEEDING_REFACTORING_TYPES.indexOf(type)<0;
                }
            }
        }
    }
])
}());
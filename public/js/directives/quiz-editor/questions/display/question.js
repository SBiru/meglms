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
    var NEEDING_REFACTORING_TYPES =['random','single','oneword','matching','blank','multiple','truefalse','studentvideoresponse','multipart','information','open'];
    app.directive('displayQuestion', [
        '$compile',
        '$timeout',
        '$sce',
        'TestbankQuestionService',
        'QuizHelper',
        function($compile,$timeout,$sce,TestbankQuestionService,QuizHelper){
            return {
                restrict:'E',
                scope:false,
                link:function($scope,$element,$attrs){
                    $scope.where = $scope.$eval($attrs.where)
                    if($scope.where!='grader' && $scope.where!='editor'){
                        NEEDING_REFACTORING_TYPES.push('wordmatching');
                    }else{
                        angular.extend($scope,QuizHelper);
                        $scope.graderView = window.location.href.indexOf('/grader/') >= 0;
                    }

                    $scope.$watch(checkQuestion,function(question){
                        if(!question) return;
                        var promise;
                        if($scope.question && $scope.question.beforeChange){
                            promise = $scope.question.beforeChange()
                        }else{
                            promise = Promise.resolve();
                        }
                        promise.then(function(){
                            $scope.question = question;
                            $scope.type = question.type.toLowerCase();
                            if(question.type){
                                validateType();
                                selectQuestionDirective();
                            }
                        })

                    })
                    function checkQuestion(){
                        return $scope.$eval($attrs.question);
                    }
                    function validateType(){
                        if(!TestbankQuestionService.questionTypes().hasOwnProperty($scope.type)){
                            throw INVALID_TYPE_MESSAGE;
                        }
                    }
                    var directives = {}
                    function selectQuestionDirective(){
                        var directive = directiveSuffix();
                        var directiveEl = '<'+directive+' display-question question="question" quiz="quiz">'+'</'+directive+'>';
                        var compiled = $compile(directiveEl)($scope);
                        removePreviousQuestion();
                        $timeout(function(){
                            directives[$scope.where+'Directive'](compiled);
                            prepareQuestion();
                        })
                    }
                    function directiveSuffix(){
                        var directive;
                        if(NEEDING_REFACTORING_TYPES.indexOf($scope.type)>=0)
                            directive= 'display-default-'+$scope.where;
                        else
                            directive= 'display-'+$scope.type+'-'+$scope.where;
                        return directive;
                    }
                    function removePreviousQuestion(){
                        if($element.find('[display-question]').length){
                            $element.find('[display-question]').remove();
                        }
                    }
                    function prepareQuestion(){
                        //must implement $scope.prepareQuestion() in all question directives
                        $timeout(function(){
                            if($scope.prepareQuestion)
                                $scope.prepareQuestion()
                            if($scope.question.prepareQuestion)
                                $scope.question.prepareQuestion()
                        },500);
                    }
                    directives.editorDirective = function(compiled){
                        $element.append(compiled);
                    }

                    directives.studentDirective = directives.editorDirective;
                    directives.graderDirective = directives.editorDirective;

                    directives.reviewDirective = function(compiled){
                        var templateUrl = $sce.getTrustedResourceUrl('/public/views/directives/quiz-editor/questions/display/reviewAnswer/question.html');
                        var include = '<div ng-include="\''+templateUrl+'\'"></div>';
                        $element.append($compile(include)($scope));
                        replaceQuestionReview(compiled);
                    }
                    function replaceQuestionReview(compiled){
                        if(isQuestionReviewIsReady()){
                            $element.find('.display-question-answer').replaceWith(compiled);
                        }
                        else{
                            $timeout(function(){
                                replaceQuestionReview(compiled)
                            },500);
                        }

                    }
                    function isQuestionReviewIsReady(){
                        return $element.find('.display-question-answer').length;
                    }
                    $scope.$on('$destroy',function(){

                            console.log('destroying question');

                    })



                }
            }
        }
    ]);
}());
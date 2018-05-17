(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app

    .directive('editQuestion', [
        '$sce',
        'TestbankTestService',
        'TestbankQuestionService',
        'Gradebook',
        function($sce,TestbankTestService,TestbankQuestionService,Gradebook){
            return {
                restrict:'E',
                templateUrl:function(elem,attrs) {
                    return attrs.type=='select'?'/public/views/directives/quiz-editor/select-question.html':'/public/views/directives/quiz-editor/edit-question.html'
                },
                scope:{
                    'question':'=?',
                    'test':'=?',
                    'type':'=?',

                },
                link:function(scope,element,attrs){
                    scope.trustAsHtml = $sce.trustAsHtml
                    scope.$index = scope.$eval('$parent.$index');

                    scope.startMoving = function(question){
                        scope.test.moving = question;
                    }
                    scope.cancelMoving = function(){
                        delete scope.test.moving;
                    }
                    scope.moveToPosition = function(index){
                        var initialIndex = scope.test.questions.indexOf(scope.test.moving);
                        var finalIndex = Math.min(scope.test.questions.length-1,index+1);
                        scope.test.questions.move(initialIndex,finalIndex);
                        var positions = {};
                        for(var i=0;i< scope.test.questions.length;i++){
                            var question = scope.test.questions[i];
                            if(question.quiz_question_id)
                                positions[question.quiz_question_id]=i;
                        }
                        TestbankTestService.questionPositions(0,positions);
                        delete scope.test.moving;
                    }
                    scope.canSaveQuestion = function(question) {
                        return !isNaN(parseFloat(question.max_points)) && question.max_points > 0;
                    }
                    scope.updateQuestionPoints = function(question,recalculate) {
                        if(!recalculate && scope.$parent.testDetails.needGradebookRecalculation){
                            Gradebook.openRecalculationWarning(
                                function(){
                                    scope.updateQuestionPoints(question,'now')
                                },
                                function(){
                                    scope.updateQuestionPoints(question,'later')
                                }
                            )
                        }else{
                            TestbankQuestionService.updateV2({
                                quizQuestionId: question.quiz_question_id,
                                points: question.max_points,
                                recalculate:recalculate
                            });
                            question.editing = false;
                        }
                    }
                }
            }
        }
    ])
    .controller('pagebreakQuestionController', ['$rootScope', '$scope', '$modal', '$state', 'nav', 'utils', '$sce', 'TestbankQuestionService',
        function($rootScope, $scope, $modal, $state, nav, utils, $sce, TestbankQuestionService) {
            if(!$scope.course){
                $scope.course = {id:$scope.$root.currentCourseID}
            }
            var updatequestion = function(question) {

                $scope.values = {};
                $scope.values.question_id = question.singlequestion.id
                $scope.values.pagebreak = question.singlequestion.pagebreak


                TestbankQuestionService.pagebreak($scope.course.id, $scope.values)
                    .success(function(response) {
                        if (response.error) {
                            console.log('ERROR');

                        }
                    })
                    .error(function(error) {
                        console.log(error);
                    });
            }


            $scope.pagebreak = function(question) {
                question.singlequestion.pagebreak = 1;
                updatequestion(question);
            }

            $scope.pagebreakremove = function(question) {
                question.singlequestion.pagebreak = 0;
                updatequestion(question);
            }

        }
    ])
}());
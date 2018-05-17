"use strict";

(function () {
var app;
try {
    app = angular.module('app.testbank');
}
catch(err) {
    app = angular.module('app');
}
app.controller('ModalSelectRandomQuestionGroupController', ['$scope', '$modal',
    function($scope, $modal) {
        $scope.open = function(){
            $modal.open({
                controller:'ModalSelectRandomQuestionGroupInstanceController as vm',
                templateUrl:'/public/views/directives/quiz-editor/modals/question.randomgroupfromtags.modal.html?v='+window.currentJsVersion,
                resolve:{
                    testId:function(){return $scope.test.id},
                }
            }).result.then(function(questions){
                $scope.test.questions = questions;
            })
        }
    }
]).controller('ModalSelectRandomQuestionGroupInstanceController', ['$scope','testId','TestbankTestService','WordmatchingUtil',
    function($scope,testId,TestbankTestService,WordmatchingUtil) {
        $scope.canSave = function(){
            return this.vm.questionCount>0 && $scope.numberOfQuestions >0 && $scope.numberOfQuestions <=this.vm.questionCount
        };
        $scope.addQuestion = function(){
            var tags = $scope.selectedTagIds || []
            TestbankTestService.randomQuiz(testId,{
                quizzes_id: testId,
                counter: $scope.numberOfQuestions,
                tags: tags.join(',')
            }).then(handleResponse)
        };
        function handleResponse(response){
            prepareQuestionsAfterSave(response.data);
            $scope.$close(response.data.questions);
        }
        function prepareQuestionsAfterSave(response){
            if(response.questions){
                response.questions.forEach(function(question){
                    if(question.type=='wordmatching')
                        WordmatchingUtil.prepareForDisplayEditor(question);
                    question.quizz_id = testId;
                })
            }
        }
        var unWatch = $scope.$watch('vm.questionCount',function(q){
            $scope.numberOfQuestions = q;
        });

        $scope.$on('$destroy',function(){
            unWatch();
        })
    }
])
}());
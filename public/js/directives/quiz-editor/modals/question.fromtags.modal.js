"use strict";

(function () {
var app;
try {
    app = angular.module('app.testbank');
}
catch(err) {
    app = angular.module('app');
}
app.controller('ModalSelectQuestionsTagsController', ['$scope', '$modal',
        function($scope,$modal) {
            $scope.open = function(){
                $modal.open({
                    controller:'ModalSelectQuestionsTagsInstanceController',
                    templateUrl:'/public/views/directives/quiz-editor/modals/question.fromtags.modal.html?v='+window.currentJsVersion,
                    resolve:{
                        testId:function(){return $scope.test.id},
                        currentQuestionIds:function(){return _.filter(_.map($scope.test.questions,function(q){return q.id}))}
                    }
                }).result.then(function(questions){
                        $scope.test.questions = questions;
                    })
            }
        }
    ])
    .controller('ModalSelectQuestionsTagsInstanceController', ['$scope','QuestionTags','TestbankQuestionService','testId','WordmatchingUtil','currentQuestionIds',
        function($scope,QuestionTags,TestbankQuestionService,testId,WordmatchingUtil,currentQuestionIds) {

            $scope.changePage = changePage;
            $scope.addQuestions = addQuestions;
            $scope.selectAll = selectAll;

            function selectAll(){
                _.each($scope.questions,function(q){
                    q.selected = 1;
                })
            }
            function changePage(){
                startSearchQuestions($scope.selectedTagIds);
            }
            function startSearchQuestions(tagIds){
                if(!(tagIds && tagIds.length)) return;
                $scope.loadingQuestions = true;
                QuestionTags.filterQuestions({
                        tags:tagIds.join(','),
                        page:$scope.paginationConfig.currentPage+1,
                        limit:$scope.paginationConfig.itemsPerPage,
                        ignoreIds:currentQuestionIds.join(',')
                    }
                ).$promise.then(
                    function(result){
                        $scope.questions = result.data;
                        $scope.loadingQuestions = false;
                        updatePaginationData(result)
                    },function(){
                        toastr.error("Could not load questions");
                        $scope.loadingQuestions = false;
                    }
                )
            }

            function updatePaginationData(result){
                $scope.paginationConfig.currentPage = result.page-1;
                $scope.paginationConfig.total = result.total;
                $scope.paginationConfig.restart && $scope.paginationConfig.restart();
            }
            function addQuestions(){
                var selectedQuestionIds = _.map(_.filter($scope.questions,function(q){return q.selected == 1}),function(q){return q.id});
                if(selectedQuestionIds.length==0) $scope.$dismiss();
                TestbankQuestionService.placequestions(testId, {question_ids:selectedQuestionIds}).success(handleSuccessResponse);
            }
            function handleSuccessResponse(response){
                if (response.error) {
                    $scope.error = response.error;

                } else {
                    if (typeof response === 'string') {
                        response = {};
                    }
                    prepareQuestionsAfterSave(response);
                    $scope.$close(response.questions);
                }
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
            $scope.paginationConfig = {
                itemsPerPage:10,
                currentPage:0,
                showNav: false,
                showOnBottom:false
            };
            $scope.tagOptions = [];

            var unWatch = $scope.$watch('selectedTagIds',startSearchQuestions);

            $scope.$on("$destroy",function(){
                unWatch();
            })

        }
    ])
}());
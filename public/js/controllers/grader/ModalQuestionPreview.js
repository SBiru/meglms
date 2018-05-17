

appControllers.controller('ModalQuestionPreview', [
    '$scope',
    'GraderQuiz',
    '$sce',
    'Alerts',
    'question',
    function($scope,GraderQuiz,$sce,Alerts,question) {
        $scope.questionId = question.id
        GraderQuiz.query({
            pageId:question.pageId,
            is_archive:true,
            studentId:question.studentId
        },function(response){
            $scope.pageInfo = response.pageInfo;
            if(response.quizzes && response.quizzes.length)
                $scope.quiz=response.quizzes[0];
        });


        $scope.openPreview = function(){
            $modal.open({
                templateUrl: '/public/views/gradebook/modals/title.html',
                controller: 'GradebookModalTitleController',
                size: 'lg',
                resolve: {
                    params: function () {
                        return {page:$scope.pageInfo,subtype:'page',hideExempt:true};
                    }
                }
            });
        }


    }
]);
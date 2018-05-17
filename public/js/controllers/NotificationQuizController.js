appControllers.controller('NotificationQuizController', ['$scope','GraderQuiz','notification','$modalInstance',
    function($scope,GraderQuiz,notification,$modalInstance) {

        GraderQuiz.query({
            pageId:notification.page_id,
            studentId:$scope.$root.user.id,
            is_archive:true
        },function(response){
            $scope.pageInfo = response.pageInfo;

            if(response.quizzes && response.quizzes.length)
                $scope.quiz=response.quizzes[0];
        });
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        }

    }
]);
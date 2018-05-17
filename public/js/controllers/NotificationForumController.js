appControllers.controller('NotificationForumController', ['$scope','ForumGrader','notification','$modalInstance',
    function($scope,ForumGrader,notification,$modalInstance) {

        ForumGrader.get({
            pageId:notification.page_id,
            studentId:notification.studentId || $scope.$root.user.id,
            archive:true,
            all:notification.forceTeacherLoad,

        },function(response){
            $scope.pageInfo = response.students[0].pageInfo;
            $scope.student = response.students[0];

        });
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        }

    }
]);
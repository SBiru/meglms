appControllers.controller('NotificationStudentFeedbackController', ['$rootScope', '$scope', '$timeout', '$sce', 'Post', 'Notification', 'ShowDatesGrades', 'notification', '$modalInstance',
    function ($rootScope, $scope, $timeout, $sce, Post, Notification, ShowDatesGrades, notification, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        $scope.trustAsHtml = $sce.trustAsHtml;

        Notification.getStudentFeedback({
            notificationId: notification.id
        }, function (res) {
            $scope.yourSubmission = res.yourSubmission;
            $scope.replies = res.replies;
        });
    }
]);
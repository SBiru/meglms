appControllers.controller('NotificationController', ['$rootScope', '$scope', '$sce', '$timeout', 'Notification',
    '$filter', '$modal', 'CurrentCourseId', 'ShowDatesGrades',
    function($rootScope, $scope, $sce, $timeout, Notification, $filter, $modal, CurrentCourseId,ShowDatesGrades) {
        $scope.notifications = new Array();
        $scope.CurrentCourseId = CurrentCourseId;
        $scope.ShowDatesGrades = ShowDatesGrades;


        Notification.get({notificationId: 'me'}, function(notifications){
            $scope.notificationCallback(notifications);
            $scope.refreshTimer(2000);
        });

        $scope.refresh = function() {
            Notification.get({notificationId: 'me'}, function(notifications){
                $scope.notificationCallback(notifications);
            });
        };

        $scope.refreshTimer = function(delay) {
            $timeout(function() {
                Notification.get({notificationId: 'me'}, function(notifications){
                    $scope.notificationCallback(notifications);
                    $scope.refreshTimer(delay);
                });
            }, delay);
        };


        $scope.open = function (notification) {
            var modalInstance = $modal.open({
                templateUrl: 'public/views/partials/notificationgradepost.html?cachesmash=5',
                windowClass: 'feedback-modal',
                controller: 'NotificationGradePostMessagesController',
                resolve: {
                    notification: function () {
                        return notification;
                    }
                }
            });
        };

        $scope.notificationCallback = function(notifications) {
            // console.log("Notifications: " +  angular.toJson(notifications));
            if(angular.isDefined(notifications.notifications)) {
                $scope.notifications = notifications.notifications;
                /*
                 Golabs 16/01/2015:
                 We get our ShowDatesGrades by the $scope.ShowDatesGrades found in services 'ShowDatesGrades' function
                 This is achieved when a call is made to the function SetDatesGrades found in the CourseController
                 ShowDatesGrades is set to scope in the NotificationController conroller which run this function.
                 */
                for(var i=0; i <  $scope.notifications.length; i++) {
                    if($scope.ShowDatesGrades.getDateGrades() === 0){
                        $scope.notifications[i].htmlSafe  =  $sce.trustAsHtml('<a data-ng-click="open(notification)">' +
                        $rootScope.preference.navs.notification_no_score_pre_name.translation + '<i>'+
                        $scope.notifications[i].fname +' '+$scope.notifications[i].lname +
                        $rootScope.preference.navs.notification_no_score_post_name.translation + '</i></a>');
                    }
                    else{
                        $scope.notifications[i].htmlSafe  =  $sce.trustAsHtml('<a data-ng-click="open(notification)">' +
                        $rootScope.preference.navs.notification_with_score_pre_name.translation + '<i>'+
                        $scope.notifications[i].fname+' '+$scope.notifications[i].lname+'</i>' +
                        $rootScope.preference.navs.notification_with_score_post_name.translation + '<br/>' +
                        $rootScope.preference.navs.notification_with_score_pre_score.translation + '<i>' +
                        $scope.notifications[i].grade +
                        $rootScope.preference.navs.notification_with_score_post_score.translation + '</i></a>');
                    }
                }
                var count = $filter('filter')(notifications.notifications, {viewed: '0'}).length;
                if(count > 0) {
                    $scope.uncheckedNotifications = '(' + count + ')';
                } else {
                    $scope.uncheckedNotifications = '';
                }
            }
        }
    }
]);
appControllers.controller('ForumParticipantsController', ['$scope','$state','Forum','$modal',
    function($scope,$state,Forum,$modal) {
        var self = this;
        Forum.loadParticipants({
            classId:0,
            pageId:$state.params.contentId
        }).$promise.then(function(participants){
            self.participants = participants;
        })

        self.openUserDetailsModal = function(user){
            $modal.open({
                templateUrl:'forum-user-details-modal.html',
                controller:'NotificationForumController',
                windowClass:'forum-grade-modal',
                resolve:{
                    notification:function () {
                        return {
                            page_id: $state.params.contentId,
                            studentId:user.userId,
                            forceTeacherLoad:1
                        }
                    }
                }
            })
        }
    }
]);
appControllers.controller('ReplyToTeacherController', [
    '$scope',
    '$modal',
    'GraderPost',
    function($scope,$modal,GraderPost   ){
        $scope.open = open;

        function open(teacherPostId){
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/grader/replytoteachermodal.html',
                controller: 'ModalReplyToTeacherController',
                size: null,
                resolve: {
                    postId: function () {
                        return teacherPostId;
                    },
                    widgetPromise:function(){
                        return  GraderPost.get({postId: 'new'});
                    },
                    contentId:function(){
                        return $scope.contentid;
                    }
                }
            });
        }
    }
]);
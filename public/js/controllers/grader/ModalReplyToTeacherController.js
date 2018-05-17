appControllers.controller('ModalReplyToTeacherController', [
    '$scope',
    '$modalInstance',
    '$sce',
    'Post',
    'Page',
    'Alerts',
    'postId',
    'widgetPromise',
    'contentId',
    function($scope,$modalInstance,$sce,Post,Page,Alerts,postId,widgetPromise,contentId){

        $scope.cancel = cancel;
        $scope.submit = submit;

        getPageInfo();

        widgetPromise.$promise.then(function(post){
            $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
            $scope.videoRecordButton = $sce.trustAsHtml(post.button);
            $scope.videoFileName = post.file_name;
        });

        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        function submit(){
            Post.teacher_feedback({
                teacher_post_id:postId,
                videoFileName : $scope.videoFileName,
                video_comment : CKEDITOR.instances.commentsVideo.getData().replace('\n','')
            },
                function(){
                    $modalInstance.close();
                },
                function(error){
                    Alerts.danger({
                        title:'An error has ocurred',
                        content:error.statusText,
                        textOk:'Ok'
                    },function(){});
                }
            );
        }

        function getPageInfo(){
            $scope.page = Page.get({id:contentId});
        }
    }
]);
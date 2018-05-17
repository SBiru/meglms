angular.module('app')


    .directive('recordVideo', [
        '$sce',
        'Post',
        'fileUpload2',
        '$compile',
        function($sce,Post,fileUpload2,$compile){
            return {
                restrict: 'E',
                require: "?ngModel",
                scope:{
                    closeAction:'=?',
                    options:'=?',
                },
                templateUrl: '/public/views/directives/record-video.html?v='+window.currentJsVersion,
                link: function (scope, element,attrs,ngModel) {
                    scope.uploadUrl ="/filesupload/video"
                    scope.submitVideoAndClose=submitVideoAndClose;
                    scope.uploadVideoAndClose=uploadVideoAndClose;
                    scope.canUpload=canUpload;
                    scope.close=close;
                    scope.onFileSelect=onFileSelect;

                    function close(){
                        scope.closeAction=false;
                    }

                    function initVideoWidget(){
                        scope.post = Post.get({
                            postId: 'new',
                            orgId:scope.$root.currentCourse.orgId
                        }, function (post) {
                            scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                            scope.videoRecordButton = $sce.trustAsHtml(post.button);
                            scope.videoFileName = post.file_name;
                            setTimeout(function(){
                                var webrtcContainer = element.find('webrtc-video-recorder');
                                if(webrtcContainer.length){
                                    webrtcContainer.replaceWith($compile(webrtcContainer)(scope));
                                }

                            })
                        });
                    }
                    function submitVideoAndClose(){
                        scope.saving = true;
                        scope.post.$saveVideo(function(post){
                            scope.saving = false;
                            if (post.message == 'successful') {
                                ngModel.$setViewValue({videoFile:post.videofilename,videoThumbnailFile:post.thumbnailfilename,videoComment:scope.video_comment});
                            } else {

                                toastr.danger(post.message);
                            }
                        })
                    }
                    function canUpload(){
                        return scope.file !== undefined;
                    }
                    function uploadVideoAndClose(){
                        scope.uploading=true;
                        fileUpload2.uploadFileToUrl(scope.file, scope.uploadUrl , '', this,function(response){
                            scope.uploading=false;
                            ngModel.$setViewValue({videoFile:response.videofilename,videoThumbnailFile:response.thumbnailfilename,videoComment:scope.video_comment,upload:true});
                        });

                    }
                    function onFileSelect(files){
                        scope.file=files[0];

                    }

                    initVideoWidget();
                }
            }
        }
    ])
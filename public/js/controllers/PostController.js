appControllers.controller('PostController', ['$rootScope', '$scope', '$timeout','$window', '$interval', '$sce','$upload', 'Upload', 'Post', 'CurrentCourseId', '$http','StudentVideoRecorder','$modal','noMenuFooterOptions','fileUpload2', 'ScormService','$q','$sce',
    function ($rootScope, $scope, $timeout,$window, $interval, $sce, $upload,Upload, Post, CurrentCourseId, $http,StudentVideoRecorder,$modal,noMenuFooterOptions,fileUpload2, ScormService,$q,$sce) {
        $scope.reply_to_id = 0;
        $scope.video_comment = '';
        $scope.video_upload_comment = '';
        $scope.file_upload_comment = '';
        $scope.is_uploading = false;
        $scope.progress_upload = 0;
        $scope.check_is_private = 0;
        $scope.templateContent = [];
        $scope.submitting = false;
        $scope.showSaving = false;
        $scope.showSubmit = false;
        $scope.is_mobile = ON_MOBILE;
        $scope.isVideoPostInMobile = false;
        $http.get('/api/test/classes').then(function (result) {
            $scope.proficiency_classes = result.data;
        });
        $scope.classId = CurrentCourseId.data.classId;
        $scope.p={
            scope:$scope
        }
        $scope.previewScorm = function () {
            $scope.scormTitle = $scope.scorm_name;
            ScormService.getPreviewUrl($scope.scorm_course_id).then(function (response) {
                var preview_url = response.data.preurl;
                $scope.final_preview_url = $sce.trustAsResourceUrl(preview_url);
            });
            var defer = $q.defer();
            var modalInstance   = $modal.open({
                templateUrl:'/public/views/directives/scorm/modal/scorm-preview.html',
                controller: 'ModalPreviewScormController',
                windowClass: 'scorm-preview',
                scope: $scope
            });
            modalInstance.result.then(function(uploadScorm){
                defer.resolve(uploadScorm);
            });
            return defer.promise;
        };
        $scope.takeTest = function(){
            $scope.scormTitle = $scope.scorm_name;
                ScormService.takeTest($scope.scorm_course_id, $scope.page_id, $scope.userMail, $scope.userFirstName, $scope.userLastName, $scope.userId).then(function (response) {
                    var preview_url = response.data.url;
                    $scope.final_preview_url = $sce.trustAsResourceUrl(preview_url);
                });
                var defer = $q.defer();
                var modalInstance   = $modal.open({
                    templateUrl:'/public/views/directives/scorm/modal/scorm-launch.html',
                    controller: 'ModalPreviewScormController',
                    windowClass: 'scorm-preview',
                    backdrop: 'static',
                    keyboard: false,
                    id : 'scorm-preview',
                    scope: $scope
                });
                modalInstance.result.then(function(uploadScorm){
                    defer.resolve(uploadScorm);
                    ScormService.getMark($scope.userId, $scope.page_id).then(function (response) {
                        $("#currentScore").text("Score : "+ response.data.score);
                        $scope.$root.$emit('NavRootUpdate');
                    });
                });
                return defer.promise;
        };
        $scope.noMenuOptions = noMenuFooterOptions;
        $scope.studentVideoRecorder = StudentVideoRecorder;
        if($scope.resizeTriggers){
            if($scope.resizeTriggers.content.setResize)
                $scope.resizeTriggers.content.setResize(true);
        }
        $scope.$on('contentData', function(event, data) {
            if(!DetectRTC.isWebRTCSupported && $scope.is_mobile && data.allow_template_post == 0 && data.allow_video_post == 1 && data.allow_upload_post!=1){
                $scope.isVideoPostInMobile = true;
            }
        });
        $scope.togglePostBox = function(owner,show){
            if($scope.postBoxOwner && !angular.equals($scope.postBoxOwner,owner)){
                $scope.postBoxOwner.showTextBox=false;
            }
            $scope.postBoxOwner = owner;
            if(show!==undefined)
                $scope.postBoxOwner.showTextBox = show;
            else
                $scope.postBoxOwner.showTextBox = !$scope.postBoxOwner.showTextBox;
            if($scope.postBoxOwner.showTextBox && $scope.allow_video_text_post == 1){
                $scope.selectingPostType = true;
            }
        }
        $scope.selectPostType = function(type){
            $scope.selectingPostType = false;
            $scope.postAs = type;
        };
        $scope.mobileOnFileSelect = function(file,event) {
            $scope.mobileUploadedVideo = file;
            event.target.value = '';
        }
        $scope.$watch('mobileUploadedVideo',function(){
            if($scope.mobileUploadedVideo && $scope.mobileUploadedVideo.length>0){
                $scope.mobileUploading=true;
                fileUpload2.uploadFileToUrl($scope.mobileUploadedVideo[0], "/filesupload/video" , '', this,function(response){
                    $scope.mobileUploading=false;
                    if(response){
                        $scope.video_comment="";
                        $scope.post.videoFileNameReady=response.videofilename;
                        $scope.post.videoThumbnailFileNameReady=response.thumbnailfilename;
                        videoFlushed=true;
                        $scope.submitPost('video');
                    }
                });
            }
        })
        $scope.$on('replyToId', function (event, data) {
            if($(".modal")){
                $(".modal").draggable({
                    handle: ".modal-header"
                });
            }


            //if($scope.allow_text_post==1 || $scope.allow_video_post==1)
            //    $scope.showTextBox = !$scope.showTextBox;
            if (typeof data === "object")
            {
                $scope['reply_to_id'] = data.reply_to_id;
                $scope['alternateReplies'] = data.alternateReplies;
            }
            else{
                $scope.reply_to_id = data;
            }
            $scope.video_comment = '';
            $scope.video_upload_comment = '';
            $scope.file_upload_comment = '';
            $scope.is_uploading = false;
            $scope.progress_upload = 0;
            $scope.check_is_private = 0;

            $scope.post = Post.get({
                postId: 'new'
            });

            //$scope.allow_video_post = "1";
        });

        $scope.$on('fileLink',function (eve,data) {
            $scope.fileLink = data;
        });

        $scope.$on('deleteId', function (event, data) {
            $scope.post = Post.delete({
                delete_id: data
            }, function (post) {
                if (post.message == 'successful') {
                    $scope.$broadcast('reloadPostedMessages', true);
                } else {
                    alert(post.message);
                }
            });
        });
        $scope.allowVideoPost = function(){
            $scope.allow_video_post = "1" ;
        }


        $scope.allowTextPost = function(){
            $scope.allow_video_post = "0";
        }
        $scope.trustAsHtml = function (html) {
            return $sce.trustAsHtml(html.trim());
        }
        $scope.showNewPost = function () {
            if ($scope.allow_video_post == 1 || $scope.allow_video_text_post == 1 || $scope.allow_text_post == 1 || $scope.allow_upload_post == 1 ||$scope.allow_upload_only_post == 1 || $scope.allow_template_post == 1) {
                return true;
            }
            return false;
        }

        $scope.newPost2 = function (reply_to_id) {
            $rootScope.$broadcast('newTimedReviewPost', true);
        }

        $scope.getHtmlTemplate = function (template) {
            if (!template) return;
            $scope.templateContent = [];

            $http.get(template).then(function (response) {
                $scope.rawHtml = response.data;
            });
        }
        $scope.openTemplatePostModal = function(){
            var selectedTemplate = $scope.selectedTemplate
            $modal.open({
                templateUrl:'/public/views/directives/app_fabric/fabric-new-post.html',
                controller:'FabricNewPost',
                windowClass:'modal-flat fabric-new-post',
                backdrop: 'static',
                resolve:{
                    templateId:function(){return selectedTemplate.id}
                }
            }).result.then(function(res){
                    if(res && res.id){
                        selectedTemplate = {id:res.id}
                    }
                    $scope.submitTemplateContent(res.templateContent,selectedTemplate)
                })
        }

        $scope.submitTemplateContent = function (templateContent,selectedTemplate) {
            /*
             $scope.post.contentid = $scope.contentid;
             $scope.post.templateContent = $scope.templateContent;
             $scope.post.reply_to_id = $scope.reply_to_id;
             $scope.post.check_is_private = $scope.check_is_private;
             */
            $scope.post = Post.templateHtml({
                data: {
                    'contentid': $scope.contentid,
                    'templateContent': templateContent || $scope.templateContent,
                    'reply_to_id': $scope.reply_to_id,
                    'check_is_private': $scope.check_is_private,
                    'template': selectedTemplate.id || $scope.selectedTemplate.id
                }
            }, function (post) {
                if (post.message == true) {
                    $scope.$broadcast('reloadPostedMessages', true);
                } else {
                    toastr.error("Something went wrong..")
                }
            });
        }


        $scope.$watch('postBoxOwner.showTextBox',function(show){
            if(show==false){
                StudentVideoRecorder.showVideoWidget=false;
                $scope.resizeTriggers.content.setResize(false);
            }else if (show && $scope.allow_video_post==1){
                StudentVideoRecorder.showVideoWidget=true;
            }
        })
        $scope.newPost = function (reply_to_id) {
            if ((angular.isDefined($scope.selectedTemplate)) && ($scope.selectedTemplate !== null)) {
                $scope.getHtmlTemplate($scope.selectedTemplate.template_url)
            }
            if($scope.resizeTriggers && !$scope.isVideoPostInMobile){
                if($scope.resizeTriggers.content.setResize)
                    $scope.resizeTriggers.content.setResize(true);
            }


            if (!angular.isDefined(reply_to_id)) {
                reply_to_id = 0;
            }

            //if($scope.allow_text_post==1 || $scope.allow_video_post==1)
            //    $scope.showTextBox = !$scope.showTextBox;
            if($(".modal")){
                $(".modal").draggable({
                    handle: ".modal-header"
                });
            }


            $scope.reply_to_id = reply_to_id;
            $scope.video_comment = '';
            $scope.check_is_private = 0;

            if (typeof CKEDITOR.instances.commentsText === "object") {
                $scope.video_comment = CKEDITOR.instances.commentsText.getData();
                $scope.text_comment = CKEDITOR.instances.commentsText.getData();
                $scope.commentsText = '';
            }

            $scope.post = Post.get({
                postId: 'new'
            });
        }
        $scope.$watch('studentVideoRecorder.videoData',function(videoData){
            if(videoData){
                $scope.video_comment=videoData.videoComment;
                $scope.post.videoFileNameReady=videoData.videoFile;
                $scope.post.videoThumbnailFileNameReady=videoData.videoThumbnailFile;
                if(videoData.upload){
                    videoFlushed=true;
                }
                $scope.submitPost('video');
            }
        })
        $scope.submitPost = function (postType,video_comment) {
            postType = typeof postType !== 'undefined' ? postType : 0;
            $scope.submitting = true;
            $scope.showSaving = true;
            $scope.showSubmit = false;

            if (!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }
            $scope.flushCounterFortimer = 0;

            if (videoFlushed != true && postType == 'video') {

                $scope.videoFlushedTimer = $interval(function () {
                    $scope.flushCounterFortimer++;
                    //console.log(videoFlushed);
                    if (videoFlushed||$scope.flushCounterFortimer>10) {

                        if (videoFlushed == true) {
                            //console.log('about to submit');
                            $scope.finallySubmitPost(video_comment);
                        } else {
                            $scope.submitting = false;
                            $scope.showSaving = false;
                            $scope.showSubmit = true;
                            alert('If you already recorded a video, wait a few moments and try submitting again.');
                        }
                        $interval.cancel($scope.videoFlushedTimer);
                    }
                }, 500);

            }
            else {
                StudentVideoRecorder.refreshWidget();
                $scope.showSaving = false;
                $scope.finallySubmitPost(video_comment,postType);

            }



        }

        $scope.finallySubmitPost = function (video_comment,postType) {

            //console.log(videoFlushed);
            if (angular.isDefined($scope.selectedFiles) && $scope.selectedFiles.length > 0 || postType == 'link') {
                $scope.file_upload_comment = CKEDITOR.instances.commentsText.getData();
                $scope.onFileUploadGenericSelect($scope.selectedFiles,video_comment);
                return;
            }
            if(video_comment === undefined){
                video_comment = '';
            }
            if ($scope.video_comment == 'Type Message Here') {
                $scope.video_comment = '';
            }

            $scope.post.contentid = $scope.contentid;
            $scope.post.videoFileName = $scope.videoFileName;
            $scope.post.reply_to_id = $scope.reply_to_id;
            $scope.post.video_comment = video_comment||$scope.video_comment;
            $scope.post.check_is_private = $scope.check_is_private;
            $scope.post.courseId = CurrentCourseId.getCourseId();

            if (typeof CKEDITOR.instances.commentsText === "object") {
                //$scope.video_comment = CKEDITOR.instances.commentsText.getData();
                $scope.post.video_comment = CKEDITOR.instances.commentsText.getData();
                $scope.commentsText = '';
            }
            if ($scope.post.video_comment == "") $scope.post.video_comment = video_comment||$scope.video_comment;
            if($scope.postAs=='video'){
                $scope.post.postAsVideo=true;
            }
            $scope.post.$submit(function (post) {
                $scope.submitting = false;
                $scope.showSaving = false;
                $scope.showSubmit = false;
                $scope.postBoxOwner.showTextBox=false;
                if (post.message == 'successful') {
                    $scope.$root.$emit('NavRootUpdate');
                    $scope.$broadcast('reloadPostedMessages', true);
                    if($scope.resizeTriggers.content && $scope.resizeTriggers.content.setResize){
                        $scope.resizeTriggers.content.setResize(false)
                    }

                    CKEDITOR.instances.commentsText.setData('');
                    $('#basicModal').modal('hide');
                } else {
                    alert(post.message);
                }
            });

        }
        $scope.getFile = function ($event){
            var fileInput = angular.element($event.target).next();
            fileInput.click();
        }
        $scope.selectFiles = function(inputId){
            angular.element('#'+inputId).click();
        }
        $scope.onFileSelect = function ($files,$event) {
            $scope.selectedFiles = $scope.selectedFiles || []
            $scope.selectedFiles = $scope.selectedFiles.concat($files);
            $scope.fileInput = $event?$event.target:undefined;
            $scope.fileSize = humanFileSize($files[0].size,true);
            noMenuFooterOptions.fileSelected=true;
            noMenuFooterOptions.postFunction=$scope.submitPost.bind($scope,'file','');
            if($scope.allow_upload_only_post==1 && !noMenuFooterOptions.isIdVerification && $scope.submit_file_automatically)
                $scope.submitPost('file','');
        };
        $scope.humanFileSize = humanFileSize;
        $scope.removeFile = function(i){
            $scope.selectedFiles.splice(i,1);
        }
        function resetFileInput(){
            if(!$scope.fileInput)
                return;
            var e = angular.element($scope.fileInput);
            e.wrap('<form>').parent('form').trigger('reset');
            e.unwrap();
            delete $scope.fileInput;
        }

        $scope.uploadPost = function () {
            $scope.is_uploading = true;
            $scope.progress_upload = 0;

            if (!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if ($scope.video_upload_comment == 'Type Message Here') {
                $scope.video_upload_comment = '';
            }

            if ($scope.check_is_private) {
                $scope.check_is_private = 1;
            }

            //$files: an array of files selected, each file has name, size, and type.
            var $files = $scope.selectedFiles
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];

                $scope.upload = $upload.upload({
                    url: '/post/upload/', //upload.php script, node.js route, or servlet url
                    //method: 'POST' or 'PUT',
                    //headers: {'header-key': 'header-value'},
                    //withCredentials: true,
                    data: {
                        contentid: $scope.contentid,
                        reply_to_id: $scope.reply_to_id,
                        video_upload_comment: $scope.video_upload_comment,
                        check_is_private: $scope.check_is_private
                    },
                    file: file, // or list of files ($files) for html5 only
                    //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                    // customize file formData name ('Content-Disposition'), server side file variable name.
                    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                    //formDataAppender: function(formData, key, val){}
                }).progress(function (evt) {
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);

                    $('#upload-progress-bar.progress-bar').width($scope.progress_upload + '%')
                }).success(function (data, status, headers, config) {
                    // file is uploaded successfully

                    if (data.message == 'successful') {
                        $scope.$broadcast('reloadPostedMessages', true);
                        $scope.$root.$emit('NavRootUpdate');
                        if($scope.allow_text_post==1 || $scope.allow_video_post==1)
                            $scope.showTextBox = false;
                        $('#basicFileUploadModal').modal('hide');
                        $('#basicModal').modal('hide');
                        $scope.is_uploading = false;
                        CKEDITOR.instances.commentsText.setData('');
                        $scope.selectedFiles=[];
                        $scope.progress_upload = 0;
                        if($scope.resizeTriggers.content && $scope.resizeTriggers.content.setResize){
                            $scope.resizeTriggers.content.setResize(false)
                        }
                        if($scope.postBoxOwner)
                            $scope.postBoxOwner.showTextBox=false;
                        resetFileInput();
                    } else {
                        alert(data.message);
                    }

                });
                //.error(...)
                //.then(success, error, progress);
                // access or attach event listeners to the underlying XMLHttpRequest.
                //.xhr(function(xhr){xhr.upload.addEventListener(...)})
            }
            /* alternative way of uploading, send the file binary with the file's content-type.
             Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
             It could also be used to monitor the progress of a normal http post/put request with large data*/
            // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
        };

        $scope.onFileUploadGenericSelect = function ($files,comment) {
            if(!$files){
                $files=$scope.selectedFiles || [];
            }
            $scope.is_uploading = true;
            $scope.progress_upload = 0;

            if (!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if ($scope.file_upload_comment == 'Type Message Here') {
                $scope.file_upload_comment = '';
            }

            if ($scope.check_is_private) {
                $scope.check_is_private = 1;
            }
            var fileUploadUrls=[]
            var fileUploadNames=[]
            var handleFileUploadResponse=function(data){
                fileUploadNames.push(data.filename);
                fileUploadUrls.push(data.upload_url);
                if(fileUploadUrls.length==$files.length) {
                    var uploader = $scope.upload = Upload.upload({
                        url: '/post/fileupload/', //upload.php script, node.js route, or servlet url
                        //method: 'POST' or 'PUT',
                        //headers: {'header-key': 'header-value'},
                        //withCredentials: true,
                        fields: {
                            activityname: $rootScope.pagename,
                            contentid: $scope.contentid,
                            reply_to_id: $scope.reply_to_id,
                            file_upload_comment: comment||$scope.file_upload_comment,
                            check_is_private: $scope.check_is_private,
                            courseId: CurrentCourseId.getCourseId(),
                            upload_url:JSON.stringify(fileUploadUrls),
                            filename:JSON.stringify(fileUploadNames)
                        }
                    });
                    uploader.progress(function (evt) {
                        $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);


                    }).success(function (data, status, headers, config){
                        handlePostResponse(data, status, headers, config);
                    });
                }
            }
            var handlePostResponse = function (data, status, headers, config) {
                // file is uploaded successfully

                if (data.message == 'successful') {
                    $scope.$broadcast('reloadPostedMessages', true);
                    $scope.$root.$emit('NavRootUpdate');
                    $('#basicFileUploadModal').modal('hide');
                    $('#basicModal').modal('hide');
                    $scope.is_uploading = false;
                    if($scope.allow_text_post==1 || $scope.allow_video_post==1)
                        $scope.showTextBox = false;
                    CKEDITOR.instances.commentsText.setData('');
                    $scope.file_upload_comment='';
                    $scope.selectedFiles=[];
                    $scope.progress_upload = 0;
                    if($scope.resizeTriggers.content && $scope.resizeTriggers.content.setResize){
                        $scope.resizeTriggers.content.setResize(false)
                    }
                    if($scope.postBoxOwner) $scope.postBoxOwner.showTextBox=false;
                    resetFileInput();


                } else {
                    alert(data.message);
                }
            }

            //$files: an array of files selected, each file has name, size, and type.
            $scope.$root.$emit('uploadOnlyStart');
            if($files.length>0){
                for (var i = 0; i < $files.length; i++) {
                    var file = $files[i];

                    $scope.upload = Upload.upload({
                        url: '/post/fileupload/', //upload.php script, node.js route, or servlet url
                        //method: 'POST' or 'PUT',
                        //headers: {'header-key': 'header-value'},
                        //withCredentials: true,
                        fields:{
                            activityname: $rootScope.pagename,
                            contentid: $scope.contentid,
                            reply_to_id: $scope.reply_to_id,
                            file_upload_comment: comment||$scope.file_upload_comment,
                            check_is_private: $scope.check_is_private,
                            courseId: CurrentCourseId.getCourseId(),
                            multiple:$files.length>1, file_order: i,
                        },

                        file: file
                        // or list of files ($files) for html5 only
                        //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                        // customize file formData name ('Content-Disposition'), server side file variable name.
                        //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                        // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                        //formDataAppender: function(formData, key, val){}
                    }).success(function (data, status, headers, config){
                        $scope.$root.$emit('uploadOnlyStop');
                        if(data.multiple){
                            handleFileUploadResponse(data);
                        }else{
                            handlePostResponse(data, status, headers, config);
                        }

                    }).then(null,null,function(evt){
                        var ratio = (100.0/$files.length)*evt.loaded / evt.total;

                        $scope.progress_upload = evt.total?parseInt(100.0*evt.loaded / evt.total):0;
                        $scope.$root.$emit('uploadOnlyProgress',$scope.progress_upload);
                        $('#upload-progress-bar.progress-bar').width($scope.progress_upload + '%')
                    });
                    //.error(...)
                    //.then(success, error, progress);
                    // access or attach event listeners to the underlying XMLHttpRequest.
                    //.xhr(function(xhr){xhr.upload.addEventListener(...)})
                }
            }else {
                $scope.upload = Upload.upload({
                    url: '/post/fileupload/',   //for posting the link
                    fields:{
                        file_link: $scope.fileLink,
                        contentid: $scope.contentid,
                        reply_to_id: $scope.reply_to_id,
                        check_is_private: $scope.check_is_private,
                        courseId: CurrentCourseId.getCourseId(),
                    }
                }).success(function (data, status, headers, config){
                    $scope.$root.$emit('uploadOnlyStop');
                    handlePostResponse(data, status, headers, config);
                }).then(null,null,function(evt){
                    $scope.progress_upload = evt.total?parseInt(100.0*evt.loaded / evt.total):0;
                    $scope.$root.$emit('uploadOnlyProgress',$scope.progress_upload);
                    $('#upload-progress-bar.progress-bar').width($scope.progress_upload + '%')
                });
            }
        };
        var cumulativeOffset = function(element) {
            var top = 0, left = 0;
            do {
                top += element.offsetTop  || 0;
                left += element.offsetLeft || 0;
                element = element.offsetParent;
            } while(element);

            return {
                top: top,
                left: left
            };
        };

    }

]).directive('uploadOnly',['$interpolate', '$rootScope',function($interpolate, $rootScope){
    return {
        restrict:'A',
        template:function(){
            var template = window.location.hash.indexOf('picture')>=0?'take-picture-post':'upload-only-post';

            return '<div ' + template + '="" btn-text="{{$root.custom_new_post_text}}"\n' +
                '                          btn-class="{{post_options.new_post_color?(post_options.new_post_color+ \'  btn btn-big margin-top-10\'):\'\'}} " ></div>'
        },
        scope:true
    }
}]).directive('uploadOnlyPost',[function(){
    return{
        restrict:'A',
        templateUrl:'/public/views/partials/student/upload-only-post.html',
        scope:true,
        link:function(scope,e,attrs){
            scope.btnClass = attrs.btnClass || 'btn btn-primary btn-big margin-top-10';
            scope.btnText = attrs.btnText || 'Upload file';
            scope.showPostTypes =false;
            scope.showLinkBox = false;
            scope.$root.$on('uploadOnlyStart',function(){
                if(scope.$root.buttonSelected != scope.$id) return;
                scope.showProgressBar = true;
                scope.progress=0;
            })
            scope.$root.$on('uploadOnlyStop',function(){
                if(scope.$root.buttonSelected != scope.$id) return;
                scope.showProgressBar = false;
                scope.progress=0;
            })
            scope.$root.$on('uploadOnlyProgress',function(e,progress){
                if(scope.$root.buttonSelected != scope.$id) return;
                scope.progress=progress;
            })
            scope.submitPost_ = function(type,other){
                scope.submitPost(type,other);
                scope.selectedFiles = [];
                scope.showPostTypes = !scope.showPostTypes
            }
            scope.onFileSelect_ = function($files,$event){
                scope.$root.buttonSelected = scope.$id;
                if(attrs.replyTo){
                    scope.$parent.reply_to_id = attrs.replyTo;
                    scope.$emit('replyToId', scope.$parent.reply_to_id);
                }else{
                    scope.$parent.reply_to_id = 0
                    scope.$emit('replyToId', scope.$parent.reply_to_id);
                }
                if($files)
                    setTimeout(function(){
                        scope.onFileSelect($files,$event)
                    });
                else
                    scope.submitPost('link','');
            }
            scope.showTypes = function (event) {
                scope.inputEle= event?angular.element(event.target).next():scope.inputEle;
                scope.showPostTypes = !scope.showPostTypes;
                scope.showLinkBox = false;
                scope.fileLink = '';
            }
            scope.postFile = function () {
                scope.inputEle.click();
                if(scope.submit_file_automatically)
                    scope.showPostTypes = !scope.showPostTypes;
            }
            scope.postLink = function () {
                scope.showLinkBox = true;
            }
            scope.submit = function (link) {
                if(!scope.fileLink && !link){
                    alert("please check the link and make sure you added the http:// or https://");
                    return;
                }
                scope.$emit('fileLink',link || scope.fileLink);
                if(scope.submit_file_automatically || link){
                    scope.onFileSelect_();
                    scope.showPostTypes = false;
                    scope.showLinkBox = false;
                }else{
                    scope.links = scope.links || [];
                    scope.links.push(scope.fileLink);
                    scope.fileLink = '';
                }

            }
            scope.removeLink = function(i){
                scope.links.splice(i,1);
            }
            scope.submitLinks = function(){
                scope.submit(JSON.stringify(scope.links))
            };
            scope.isProficiencyClass = function () {
                var result = _.findWhere(scope.proficiency_classes, {id: scope.courseInfo.data.class_id });
                return result!=undefined;
            }
            attrs.$observe('btnText',function(btnText){
                if(btnText){
                    scope.btnText = btnText;
                }
            })
            attrs.$observe('btnClass',function(btnClass){
                if(btnClass){
                    scope.btnClass = attrs.btnClass;
                }
            })
        }
    }
}]).directive('takePicturePost',['$modal','UploadFile','Upload','CurrentCourseId',function($modal,UploadFile,Upload,CurrentCourseId){
    return{
        restrict:'A',
        template:'<button type="button" ng-click="openModal()"  class="{{btnClass}}" ><span class="fa fa-camera"></span> {{btnText}}</button>',
        scope:true,
        link:function(scope,e,attrs){
            scope.btnClass = attrs.btnClass || 'btn btn-primary btn-big margin-top-10';
            scope.btnText = attrs.btnText || 'Upload file';

            scope.openModal = function(){
                $modal.open({
                    controller:['$scope','params',function($scope,params){
                        $scope.params = params;
                        $scope.submit = function(base64){
                            UploadFile.imageData({
                                imageData:base64
                            },function(res) {
                                if(!res.filename)
                                    return handleError();
                                submitPost(res.filename)

                            },handleError);
                            function submitPost(filename){
                                var path = filename.split('/');
                                Upload.upload({
                                    url: '/post/fileupload/',   //for posting the link
                                    fields:{
                                        upload_url: filename,
                                        filename: path[path.length-1],
                                        contentid: scope.contentid,
                                        reply_to_id: scope.reply_to_id,
                                        check_is_private: scope.check_is_private,
                                        courseId: CurrentCourseId.getCourseId(),
                                    }
                                }).success(function (data, status, headers, config){
                                    scope.$root.$broadcast('reloadPostedMessages', true);
                                    scope.$root.$emit('NavRootUpdate');
                                    $scope.$dismiss();
                                }).then(null,handleError,function(evt){

                                });
                            }
                            function handleError(){
                                toastr.error('Could not upload your picture. Please, verify your connection and try again.')
                            }
                        }
                    }],
                    templateUrl:'/public/views/partials/student/take-picture-modal.html',
                    resolve:{
                        params:function(){
                            return {
                                title:scope.btnText
                            }
                        }
                    }
                })
            }

            attrs.$observe('btnText',function(btnText){
                if(btnText){
                    scope.btnText = btnText;
                }
            });
            attrs.$observe('btnClass',function(btnClass){
                if(btnClass){
                    scope.btnClass = attrs.btnClass;
                }
            })

        }
    }
}]).directive('takePicture',function(){
    return {
        restrict:'E',
        templateUrl:'take-picture.html',
        scope:{
            onSubmit:'=?'
        },
        link:function(scope,el){
            var video = el.find('video')[0];
            var canvas1 = el.find('#canvas1')[0];
            var canvas2 = el.find('#canvas2')[0];
            var context1 = canvas1.getContext('2d');
            var context2 = canvas2.getContext('2d');
            var _stream;
            scope.currentStep = 1;
            if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Not adding `{ audio: true }` since we only want video now
                navigator.mediaDevices.getUserMedia({ video: {
                    mandatory: {
                        maxWidth: 342,
                        maxHeight: 256
                    }
                } }).then(function(stream) {
                    _stream = stream
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                });
            }
            scope.take_picture = function(){
                var imageObj = new Image();

                imageObj.onload = function() {
                    // draw cropped image
                    var sourceX = 43;
                    var sourceY = 0;
                    var sourceWidth = 256;
                    var sourceHeight = 256;
                    var destWidth = sourceWidth;
                    var destHeight = sourceHeight;
                    context2.clearRect(0, 0, canvas2.width, canvas2.height)
                    context2.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, destWidth, destHeight);
                };
                context1.drawImage(video, 0,0,video.width,video.height);
                imageObj.src = canvas1.toDataURL("image/png");



                scope.currentStep = 2;
            }
            scope.redo = function(){
                scope.currentStep = 1;
                context2.clearRect(0, 0, canvas2.width, canvas2.height);
            }
            scope.submit = function(){
                scope.onSubmit(canvas2.toDataURL().split(',')[1])
            }
            scope.$on('$destroy',function(){
                if(_stream){
                    var track = _stream.getTracks()[0];  // if only one media track
// ...
                    track.stop();
                }

            })
        }
    }
});
function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}
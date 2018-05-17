/**
 * GraderPostController is used for operations involving graders submitting feedback to the server on the Grader app.
 */
appControllers.controller('GraderPostController', ['$rootScope', '$scope','$modal', '$timeout', '$sce', '$upload', 'GraderPost',
    function($rootScope, $scope, $modal,$timeout, $sce, $upload, GraderPost) {
        $scope.reply_to_id = 0;
        $scope.video_comment = '';
        $scope.video_upload_comment = '';
        $scope.file_upload_comment = '';
        $scope.is_uploading = false;
        $scope.progress_upload = 0;
        $scope.check_is_private = 0;
        $scope.$on('videoGradeModal', function(event, data) {
            $(".modal").draggable({
                handle: ".modal-header"
            });
            $scope.reply_to_id = data.post_id;
            $scope.grade = data.grade;
            $scope.grade_comments = data.grade_comments;
            $scope.teacher_notes = data.teacher_notes;
            $scope.video_upload_comment = '';
            $scope.file_upload_comment = '';
            $scope.is_uploading = false;
            $scope.progress_upload = 0;
            $scope.check_is_private = 0;
            $scope.post = GraderPost.get({postId: 'new'}, function(post) {
                $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                $scope.videoRecordButton = $sce.trustAsHtml(post.button);
                $scope.videoFileName = post.file_name;
            });
        });
        $scope.openPreview = function(){
            $modal.open({
                templateUrl: '/public/views/gradebook/modals/title.html',
                controller: 'GradebookModalTitleController',
                size: 'lg',
                resolve: {
                    params: function () {
                        return {page:$scope.$root.pageInfo,subtype:'page',hideExempt:true};
                    }
                }
            });

        }
        $scope.isArchive = function(){
            return window.location.href.indexOf('archive')>=0;
        }
        $scope.needingFeedback = !$scope.isArchive();
        $scope.$on('replyToId', function(event, data) {
            console.log("Reply To ID EMITTER: " + data);

            $(".modal").draggable({
                handle: ".modal-header"
            });

            $scope.reply_to_id = data;
            $scope.video_comment = '';
            $scope.video_upload_comment = '';
            $scope.file_upload_comment = '';
            $scope.is_uploading = false;
            $scope.progress_upload = 0;
            $scope.check_is_private = 0;

            $scope.post = GraderPost.get({postId: 'new'}, function(post) {
                $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                $scope.videoRecordButton = $sce.trustAsHtml(post.button);
                $scope.videoFileName = post.file_name;
            });

            

        });


        $scope.$on('deleteId', function(event, data) {
            $scope.post = GraderPost.delete({delete_id: data}, function(post) {
                console.log(post.message);
                if(post.message=='successful') {
                    $scope.$broadcast('reloadPostedMessages', true);
                } else {
                    toastr.error(post.message);
                }
            });
        });

        $scope.showNewPost = function() {
            if($scope.allow_video_post == 1 || $scope.allow_text_post == 1 || $scope.allow_upload_post == 1 || $scope.allow_template_post == 1) {
                return true;
            }


            return false;
        }

        $scope.newPost = function(reply_to_id) {
            if(!angular.isDefined(reply_to_id)) {
                reply_to_id = 0;
            }

            $(".modal").draggable({
                handle: ".modal-header"
            });

            $scope.reply_to_id = reply_to_id;
            $scope.video_comment = '';
            $scope.check_is_private = 0;

            console.log("Reply To Id: " + $scope.reply_to_id);

            $scope.post = GraderPost.get({postId: 'new'}, function(post) {
                $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                $scope.videoRecordButton = $sce.trustAsHtml(post.button);
                $scope.videoFileName = post.file_name;
            });
        }

        $scope.submitPost = function() {
            if(!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if($scope.video_comment == 'Type Message Here') {
                $scope.video_comment = '';
            }

            $scope.post.contentid = $scope.contentid;
            $scope.post.videoFileName = $scope.videoFileName;
            $scope.post.reply_to_id = $scope.reply_to_id;
            $scope.post.video_comment = $scope.video_comment;
            $scope.post.check_is_private = $scope.check_is_private;

            $scope.post.$submit(function(post) {
                console.log(post.message);
                if(post.message=='successful') {
                    $scope.$broadcast('reloadPostedMessages', true);

                    $('#basicModal').modal('hide');
                } else {
                    toastr.error(post.message);
                }
            });
        }

        $scope.submitVideoPost = function(){
            $('#basicModal').modal('hide');
        }

        $scope.submitGradePost = function() {
            if(!angular.isDefined($scope.reply_to_id)) {
                return;
            }

            

            if($scope.video_comment == 'Type Message Here') {
                $scope.video_comment = '';
            }

            $scope.post.contentid = $scope.contentid;
            $scope.post.videoFileName = $scope.videoFileName;
            $scope.post.reply_to_id = $scope.reply_to_id;
            $scope.post.video_comment = $scope.video_comment;
            $scope.post.check_is_private = $scope.check_is_private;
            //Even tho
            $scope.post.grade = $scope.grade;
            $scope.post.teacher_notes = $scope.teacher_notes;
            $scope.post.grade_comments = $scope.grade_comments;                        
            GraderPost.grade({post_id: $scope.reply_to_id, grade: $scope.modal_grade, feedback: $scope.video_comment, notes: $scope.modal_teacher_notes, videoFileName: $scope.videoFileName}, function(post) {
                if(post.message=='successful') {
                    $scope.$broadcast('reloadPostedMessages', true);
                    //If we are in archive we do not want to update the menu.
                    if (!window.location.href.match(/graderarchive|graderarchivecontent/)){
                        $rootScope.$broadcast('NavUpdateMenuStatic', true);
                    }
                } else {
                    toastr.error(post.message);
                }
            });
        }

        $scope.onFileSelect = function($files) {
            $scope.is_uploading = true;
            $scope.progress_upload = 0;

            if(!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if($scope.video_upload_comment == 'Type Message Here') {
                $scope.video_upload_comment = '';
            }

            console.log("Reply To Id: " + $scope.reply_to_id);
            console.log('submitting post with contentid: ' + $scope.contentid);
            console.log('submitting post comment: ' + $scope.video_upload_comment);
            console.log('submitting check is private: ' + $scope.check_is_private);

            if($scope.check_is_private){
                $scope.check_is_private = 1;
            }

            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];

                $scope.upload = $upload.upload({
                    url: '/graderpost/upload/', //upload.php script, node.js route, or servlet url
                    //method: 'POST' or 'PUT',
                    //headers: {'header-key': 'header-value'},
                    //withCredentials: true,
                    data: {contentid: $scope.contentid, reply_to_id: $scope.reply_to_id, video_upload_comment: $scope.video_upload_comment, check_is_private: $scope.check_is_private},
                    file: file, // or list of files ($files) for html5 only
                    //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                    // customize file formData name ('Content-Disposition'), server side file variable name.
                    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                    //formDataAppender: function(formData, key, val){}
                }).progress(function(evt) {
                    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);

                    console.log("progress-bar width: " + $('.progress-bar').width());

                    $('.progress-bar').width($scope.progress_upload + '%')
                }).success(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);


                    if(data.message=='successful') {
                        $scope.$broadcast('reloadPostedMessages', true);

                        $('#basicModal').modal('hide');
                        $scope.is_uploading = false;
                        $scope.progress_upload = 0;
                    } else {
                        toastr.error(data.message);
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
        $scope.expandResponse = function(response){
            $modal.open({
                templateUrl:'expand-response-modal.html',
                windowClass:'template-response-modal',
                controller:['$scope',function($scope){
                    $scope.message = response;

                }]
            })
        }
        $scope.onFileUploadGenericSelect = function($files) {
            $scope.is_uploading = true;
            $scope.progress_upload = 0;

            if(!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if($scope.file_upload_comment == 'Type Message Here') {
                $scope.file_upload_comment = '';
            }

            console.log("Reply To Id: " + $scope.reply_to_id);
            console.log('submitting post with contentid: ' + $scope.contentid);
            console.log('submitting post comment: ' + $scope.file_upload_comment);
            console.log('submitting check is private: ' + $scope.check_is_private);

            if($scope.check_is_private){
                $scope.check_is_private = 1;
            }

            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];

                $scope.upload = $upload.upload({
                    url: '/graderpost/fileupload/', //upload.php script, node.js route, or servlet url
                    //method: 'POST' or 'PUT',
                    //headers: {'header-key': 'header-value'},
                    //withCredentials: true,
                    data: {contentid: $scope.contentid, reply_to_id: $scope.reply_to_id, file_upload_comment: $scope.file_upload_comment, check_is_private: $scope.check_is_private},
                    file: file // or list of files ($files) for html5 only
                    //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                    // customize file formData name ('Content-Disposition'), server side file variable name.
                    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                    //formDataAppender: function(formData, key, val){}
                }).progress(function(evt) {
                    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);

                    console.log("progress-bar width: " + $('.progress-bar').width());

                    $('.progress-bar').width($scope.progress_upload + '%')
                }).success(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);


                    if(data.message=='successful') {
                        $scope.$broadcast('reloadPostedMessages', true);

                        $('#basicFileUploadModal').modal('hide');
                        $scope.is_uploading = false;
                        $scope.progress_upload = 0;
                    } else {
                        toastr.error(data.message);
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

    }


]);
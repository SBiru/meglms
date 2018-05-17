'use strict';

angular.module('app')

    /*
     *
     *
     */
    .directive('graderNonSubmittable',
    [ 'GraderPost','Page','$modal',
        function(GraderPost,Page,$modal) {
            return {
                restrict: 'E',
                scope: {
                    score:'=?',
                    params:'=?',
                    page:'=?',
                    options: '=?'
                },
                templateUrl: '/public/views/directives/graderNonSubmittable.html?v='+window.currentJsVersion,

                link: function ($scope, $element) {
                    $scope.message={}
                    $scope.data = {}

                    getPost();
                    $scope.$on('gradeUsingRubric',grade);

                    function grade(){

                        GraderPost.grade({
                            grade: $scope.score.initial,
                            feedback: $scope.score.comments || '',
                            notes: $scope.message.teacher_notes || '',
                            rubric: $scope.rubricData,
                            class_id: $scope.$root.classInfo.id,
                            courseId:$scope.$root.classInfo.courseId,
                            page_id:$scope.page.id,
                            user_id:$scope.params.student.id,
                            nonSubmittablePage:true,
                            post_id:$scope.postId,
                            archive:$scope.teacherPostId,
                            videoFileNameReady:$scope.videoFileName,
                            videoThumbnailFileNameReady:$scope.videoThumbnailFileName
                        }, function (post) {
                            $scope.$broadcast('gradeRubric', {
                                postid: post.post_id,
                                teacherid: post.teacherid
                            });
                            if($scope.options&&$scope.options.reload===false)
                                $scope.$root.$emit('graderNonSubmittableFinished')
                            else
                                window.location.reload();
                        });
                    }
                    function getPost(){
                        Page.getPosts({
                            id:$scope.page.id,
                            studentId:$scope.params.student.id
                        },function(posts){
                            if(posts.length){
                                $scope.postId = posts[0].id;
                                $scope.teacherPostId = posts[0].teacherPostId;
                                $scope.score.comments = posts[0].teacherMessage
                                $scope.videoFileName=posts[0].teacherVideoUrl
                                $scope.videoThumbnailFileName=posts[0].teacherThumbnailUrl
                                $scope.userName = posts[0].teacherName
                                $scope.now = moment(posts[0].teacherCreated).format("M/YY/DD h:mm:ss a");
                            }
                        },
                          function(error){

                          }
                        )
                    }
                    function updateGradeVideo(response){
                        if(!response) return;
                        $scope.videoThumbnailFileName=response.videoThumbnailFile;
                        $scope.videoFileName=response.videoFile;
                        $scope.userName = $scope.$root.user.fname + ' ' + $scope.$root.user.lname
                        $scope.now = moment().format("M/YY/DD h:mm:ss a");

                        $scope.showVideoRecorder = false;
                    }
                    $scope.$watch('data.videoData',updateGradeVideo)

                }
            };
        }
    ]
);

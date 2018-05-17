 /**
 * GraderPostedMessagesController is used to retrieve all of the items that need to be graded
 */
appControllers.controller('GraderPostedMessagesController', ['$rootScope', '$scope','$q','$filter', '$timeout', '$sce', '$window', 'GraderSortOrder','GraderPost', 'graderactivity','CurrentCourseId', '$http','GraderQuiz','GraderData','ForumGrader',
    function($rootScope, $scope,$q,$filter, $timeout, $sce, $window,GraderSortOrder, GraderPost, graderactivity,CurrentCourseId,$http,GraderQuiz,GraderData,ForumGrader) {
        $scope.studentsNeedingGrading = new Array(); //So we can have a list of students to filter by.
        $scope.allPostedMessages = new Array(); // Store a list of all posted messages so a filter can be undone without another AJAX call
        $scope.numPosts="10";
        $scope.getAllPosts = getAllPosts;
        $scope.graderactivity = graderactivity;
        $scope.graderData=GraderData;

        var cleanup = [];
        graderactivity.windowwatcher($scope, $window);

        function getAllPosts(numPosts,callback){
            $scope.allPostedMessages = new Array();
            $scope.postedMessages = [];
            if(numPosts=='all')
                numPosts=null;
            var posts = GraderPost.all({
                courseid: CurrentCourseId.getCourseIdFromCookie(),
                num_posts:numPosts,
                sortOrder:GraderSortOrder.getMode()
            }).$promise;
            var quizzes = GraderQuiz.allNeedingGrade({
                classId:CurrentCourseId.getCourseInfo().classId,
                courseId:CurrentCourseId.getCourseIdFromCookie()
            }).$promise;
            var forums = ForumGrader.all({
                courseId:CurrentCourseId.getCourseIdFromCookie()
            }).$promise;
            var query = {
                posts:posts,
                quizzes:quizzes,
                forums:forums
            };
            graderactivity.clear();
            $q.all(query).then(function(results) {
                var posts = results.posts,
                    quizzes = results.quizzes,
                    forums = results.forums;

                delete $scope.currentMessageId;
                delete $scope.postedMessages;
                graderactivity.setPostedMessages($scope, $rootScope, posts,$sce,$http);
                graderactivity.quizzes = quizzes;
                graderactivity.forums = forums;
                graderactivity.prepareMessagesAndQuizzes($scope);
                graderactivity.updateRubrics($scope);
                callback && callback();
            })

        }

        if ($scope.courseid) {
            $scope.current_video_player = '';
            $scope.isAll = true;
            getAllPosts($scope.numPosts);
        } else {
            $scope.current_video_player = '';
            $scope.postedMessages = [];
            graderactivity.quizzes = [];
            graderactivity.forums = [];
            graderactivity.setPostedMessages($scope, $rootScope, [],$sce,$http);
            $scope.posted = GraderPost.query({
                postId: $scope.contentid,
                courseId:CurrentCourseId.getCourseId(),
                sortOrder:GraderSortOrder.getMode()
            }, function(messages) {
                $timeout(function(){
                    graderactivity.setPostedMessages($scope, $rootScope, messages,$sce,$http);
                    graderactivity.updateRubrics($scope)
                })

            });
        }

        $rootScope.$broadcast('NavUpdateMenuStatic');
        var reloading = false;
        function reloadPostedMessages(event, data) {
            if(reloading) return ;
            $scope.eventdata = data;
            if(data && data.courseId){
                $scope.courseid = data.courseId ;
            }
            $scope.postedMessages = [];
            //Getting our $window part of $scope. for single sed assignments.
            if ($scope.eventdata === 'RemoveCurrent'){
                $scope.window = $window;
                $scope.GetAllGrader = angular.element('#FeedbackNeeded').attr("href");
            }
            if ($scope.courseid) {
                reloading = true;
                getAllPosts($scope.numPosts,function(){
                    reloading = false;
                })

            } else {
                $scope.posted = GraderPost.query({
                    postId: $scope.contentid,
                    courseId:CurrentCourseId.getCourseId(),
                    sortOrder:GraderSortOrder.getMode()
                }, function(messages) {
                    if (messages.postmessages.length > 0) {
                        $scope.currentMessageId = messages.postmessages[0].id;
                    }
                    else
                    {

                    }

                    //When a Post to student occurs.
                    if ((angular.isDefined($scope.eventdata)) && (typeof messages !== 'undefined')) {
                        if ($scope.eventdata === 'RemoveCurrent'){
                            if (messages.postmessages.length === 0)
                                $scope.window.location = $scope.GetAllGrader;
                        }
                    }
                    $scope.postedMessages = [];
                    $timeout(function(){graderactivity.setPostedMessages($scope, $rootScope, messages,$sce,$http);})


                });
            }
            $rootScope.$broadcast('NavUpdateMenuStatic');
        }


        cleanup.push($scope.$on('reloadPostedMessages', reloadPostedMessages ));
        cleanup.push($scope.$root.$on('reloadPostedMessages', reloadPostedMessages ));
        cleanup.push($scope.$root.$on('reloadPostedMessagesSilent', reloadPostedMessages ));

        $scope.replyTo = function(reply_to_id) {
            if (!angular.isDefined(reply_to_id)) {
                reply_to_id = 0;
            }
            
            $scope.reply_to_id = reply_to_id;
            
            $scope.$emit('replyToId', $scope.reply_to_id);
        };
        
        $scope.deletePost = function(delete_id) {
            if (!angular.isDefined(delete_id)) {
                return;
            }
            
            if (confirm("Are You Sure You Want To Delete Post") == true) {
                $scope.delete_id = delete_id;
                $scope.$emit('deleteId', $scope.delete_id);
            }
        };
        
        
        $scope.openVideoPlayer = function(video_message_id, modal_id) {
            for (var i = 0; $scope.postedMessages.length; i++) {
                if ($scope.postedMessages[i].id == video_message_id) {
                    $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');
                    
                    break;
                } else if ($scope.postedMessages[i].children && $scope.postedMessages[i].children.length > 0) {
                    var found_in_child = false;
                    for (var j = 0; j < $scope.postedMessages[i].children.length; j++) {
                        if ($scope.postedMessages[i].children[j].id == video_message_id) {
                            $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].children[j].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');
                            found_in_child = true;
                        }
                    }
                    
                    if (found_in_child) {
                        break;
                    }
                }
            }
            
            $('#' + modal_id).modal('show');
            $('#' + modal_id).on('hide.bs.modal', function() {
                document.getElementById('defaultVideoPlayer').pause();
            })
        };
        
        $scope.indentClass = function(indent_count) {
            return "indent-" + indent_count;
        };

        /*
        Golabs 29/01/2015
        we need to move to the right slightly
        */
        $scope.rightby10 = function(videos) {
            if (videos > 4)
                return "rightby10";
        };

        /*
        Golabs 01/02/2015
        We are testing to see what tab "Messageid" we are on.
        this is for a ng-class call to set the active tab.
        */
        $scope.messageClassActive = function(messageid,message) {
            if (messageid === message.id) {
                return 'active';
            }
        };
        cleanup.push($scope.$watch('graderactivity.postedMessages',function(postedMessages){
            $scope.postedMessages = $scope.graderactivity.postedMessages;
        },true));

        /*
        Golabs 01/02/2015
        We are changing our currentMessageId this is so we can
        do things like tab changes.
        Basically what we are doing so when the user clicks on a tab is
        to switch the current selected and the new selcted around in the
        postedMessages array this is so Angular can get the frist instanace
        and display NOTE: the morethenone is needed see in services setPostedMessages
        in messagegrouper
        */
        $scope.ChangecurrentMessageId = function(messageid, pagename, $event) {
            var current;
            $($event.target).closest('ul').find('li').each(
            function() {
                if ($(this).hasClass('active'))
                    current = $(this).find('a').first().attr('data-id');
            }
            );
            //we will grab our current and switch it with our new message so that 
            //angular will display before this doing a switch is best as we just switch our keys around.
            $scope.currentMessageId = messageid;
            $scope.pagename = pagename;
            var oldkey, newkey, tmpmsg;
            for (var i = 0; i < $scope.postedMessages.length; i++) 
            {
                if(!$scope.postedMessages[i])
                    continue;
                if ($scope.postedMessages[i].id === current) {
                    oldkey = i;
                }
                if ($scope.postedMessages[i].id === $scope.currentMessageId) {
                    newkey = i;
                }
                $scope.postedMessages[i].loadvideo=false;
            }
            //Doing our switch around....
            if(!$scope.postedMessages[oldkey]) return;
            $scope.postedMessages[oldkey].morethenone = 2;
            tmpmsg = $scope.postedMessages[oldkey];
            $scope.postedMessages[oldkey] = $scope.postedMessages[newkey];
            $scope.postedMessages[oldkey].morethenone = 1;
            $scope.postedMessages[newkey] = tmpmsg;
            graderactivity.updateRubrics($scope)
        };

        /**
         $scope.applyStudentFilter is called right after the user makes a selection in the student filter. It will
         re-render the list of grading to only include grading for this student.
         @param selectedStudent the object for the student that was selected in the filter.
         **/
        $scope.applyStudentFilter = function(selectedStudent) {
            graderactivity.applyStudentFilter2(selectedStudent);
            graderactivity.updateRubrics($scope)
        };

        /**
         $scope.applyActivityTypeFilter is called right after the user makes a selection in the activity type filter. It will
         re-render the list of grading to only include grading for this activity type.
         @param selectedStudent the object for the activity type that was selected in the filter.
         **/
        $scope.applyActivityTypeFilter = function(selectedActivityType) {
            graderactivity.applyActivityTypeFilter($scope, selectedActivityType);
        };

        /**
         $scope.applyTeacherFilter is called right after the user makes a selection in the teacher filter. It will
         re-render the list of grading to only include grading that the selected teacher has completed.
         @param selectedTeacher the object for the activity type that was selected in the filter.
         **/
        $scope.applyTeacherFilter = function(selectedTeacher){
            graderactivity.applyTeacherFilter($scope, selectedTeacher);
            graderactivity.updateRubrics($scope)
        };

        // openStartDate is called when a user clicks on the calendar button under the start date range filter field
        $scope.dateFilter = {};
        $scope.openStartDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.dateFilter.openedStartDate = true;
        };

        // openEndDate is called when a user clicks on the calendar button under the end date range filter field
        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.dateFilter.openedEndDate = true;
        };

        // dateOptions for the start and end date range filter fields.
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        // cleanup.push($scope.$watch('graderData.dateRange.max',function(){
        //     graderactivity.applyStartDateFilter($scope);
        //     graderactivity.updateRubrics($scope)
        // }));
        // cleanup.push($scope.$watch('graderData.dateRange.min',function(){
        //     graderactivity.applyStartDateFilter($scope);
        //     graderactivity.updateRubrics($scope)
        // }));
        $scope.endDateChanged = function(date){
            graderactivity.applyStartDateFilter($scope);
            graderactivity.updateRubrics($scope)
        };

        $scope.startDateChanged = function(date){
            graderactivity.applyStartDateFilter($scope);
            graderactivity.updateRubrics($scope)
        };
        $scope.dateRangeChanged = function(){

        }
        $scope.advancedGrader = {};
        $scope.clearGradeMessage = function(){
            $scope.advancedGrader.gradeComments = '';
            $scope.currentMessageBeingEdited = null;
        };
        $scope.applyGradeMessage = function(){
            $scope.currentMessageBeingEdited.grade_comments = $scope.advancedGrader.gradeComments;
            $scope.clearGradeMessage();
        };
        $scope.setCurrentMessageBeingEdited = function(message){
            $scope.currentMessageBeingEdited = message;
            $scope.advancedGrader.gradeComments = $scope.currentMessageBeingEdited.grade_comments;
        };
        // Use a localized date format for the field value
        $scope.format = _global_localized_date_formats[navigator.language] || 'dd/MM/yy';

        $scope.$on('$destroy',function(){
            cleanup.forEach(function(fn){
                fn & fn();
            })
        })
    }
]).service('GraderSortOrder',['Cookiecutter',function(CookieCutter){
    return {
        mode: null,
        getMode:function(){
            return CookieCutter.getCookiebyname('grader_sort_order',true)
        },
        setMode:function(mode){
            CookieCutter.setcookie('grader_sort_order',mode)
        }
    }
}]);

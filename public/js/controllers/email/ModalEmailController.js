appControllers.controller('ModalEmailController', ['$rootScope', '$scope','$sce','$timeout','Email','$modalInstance','$controller','new_messages','Notification','$modal','$filter','CurrentCourseId','UserV2','Class',
    function($rootScope,$scope,$sce,$timeout,Email,$modalInstance,$controller,new_messages,Notification,$modal,$filter,CurrentCourseId,UserV2,Class) {
        //inheriting BaseController
        $controller('ModalEmailBaseController', {$scope: $scope,$modalInstance:$modalInstance});
        var me = $scope.$root.user;
        var hideMessages = me.org.hide_all_messages && !(
                me.is_teacher ||
                me.is_edit_teacher ||
                me.is_super_admin ||
                me.is_advisor ||
                me.is_organization_admin
            );
        if (me.org.disallow_email){
            var newTab = _.findWhere(email_modes,{type:'new'});
            if(newTab)
                email_modes.splice(email_modes.indexOf(newTab,1));
        }
        if (hideMessages){
            var allMessagesTab = _.findWhere(email_modes,{type:'sent'});
            if(allMessagesTab)
                email_modes.splice(email_modes.indexOf(allMessagesTab,1));
        }
        
        $scope.modes= email_modes;

        if (!$scope.$root.user.org.disallow_email){
        $scope.$watch('newMessagesCount',function(newValue){
            var mode = _.findWhere($scope.modes,{type:'sent'});
            if(newValue >0)
                mode.name = 'All Messages (' + $scope.newMessagesCount + ')';
            else mode.name = 'All Messages';
        });
      }
        if(!hideMessages){
            $scope.$watch('newFeedbackCount',function(newValue){
                var mode = _.findWhere($scope.modes,{type:'feedback'});
                if(newValue >0)
                    mode.name = 'Teacher Feedback (' + $scope.newFeedbackCount + ')';
                else mode.name = 'Teacher Feedback';
            });
            $scope.$watch('newStudentFeedbackCount',function(newValue){
                var mode = _.findWhere($scope.modes,{type:'student_feedback'});
                if(newValue >0)
                    mode.name = 'Student Feedback (' + $scope.newStudentFeedbackCount + ')';
                else mode.name = 'Student Feedback';
            });
        }


        var handleEmails  =function(emails){
            $scope.emails_temp=[];
            $scope.unReadMessages = jQuery.grep(emails, function(e){
                return e.type=='received' && e.read=='0'
            });
            $scope.newMessagesCount = $scope.unReadMessages.length;

            for(i in emails){
                emails[i].message_preview = preview_html(emails[i].message,40)
                emails[i].subject_preview = preview_html(emails[i].subject,40)
                var to_preview = preview_list(emails[i].receivers,3);
                emails[i].to_preview = to_preview.preview
                emails[i].to_list = to_preview.list;
                emails[i].message = $sce.trustAsHtml(emails[i].message)
                emails[i].dateTime = moment(emails[i].created).add(moment().utcOffset(),'minutes')
                emails[i].dateTime_text = emails[i].dateTime.diff(moment(),'days')==0?emails[i].dateTime.startOf().fromNow():emails[i].dateTime.format('ll')
                delete emails[i].created
            }
            $scope.emails_temp.push.apply( $scope.emails_temp, emails)
            customSort($scope.emails_temp,'dateTime');
            $scope.emails=$scope.emails_temp.reverse();
            var a = 1;
        };
        var handleStudentNotifications = function (feedbacks){
            var newStudentFeedbackCount = 0;
            $scope.student_feedbacks = _.map(feedbacks,function(f){
                f.messagePreview = preview_html(f.message,40);
                f.dateTime = moment(f.created).add(moment().utcOffset(),'minutes')
                f.dateTime_text = f.dateTime.diff(moment(),'days')==0?f.dateTime.startOf().fromNow():f.dateTime.format('ll')
                if(!f.viewed)
                    newStudentFeedbackCount++;
                return f;
            });
            $scope.newStudentFeedbackCount =newStudentFeedbackCount;
            if($scope.newStudentFeedbackCount>0){
                var mode = $filter('filter')($scope.modes, {type: 'student_feedback'})[0];
                mode.name = 'Student Feedback (' + $scope.newStudentFeedbackCount + ')';
            }
        };
        var handleTeacherNotifications = function (notifications,teacher_notifications){
            var n = notifications;


            for(var i in teacher_notifications){
                teacher_notifications[i].dateTime = moment(teacher_notifications[i].created).add(moment().utcOffset(),'minutes')
                teacher_notifications[i].dateTime_text = teacher_notifications[i].dateTime.diff(moment(),'days')==0?teacher_notifications[i].dateTime.startOf().fromNow():teacher_notifications[i].dateTime.format('ll')
                teacher_notifications[i].isTeacher=true;
            }

            for(i in n){
                n[i].dateTime = moment(n[i].created).add(moment().utcOffset(),'minutes')
                n[i].dateTime_text = n[i].dateTime.diff(moment(),'days')==0?n[i].dateTime.startOf().fromNow():n[i].dateTime.format('ll')

            }
            n.push.apply(n,teacher_notifications);

            $scope.unViewedFeedbacks = $filter('filter')(n, {viewed: '0'});
            $scope.newFeedbackCount = $scope.unViewedFeedbacks.length;
            if($scope.newFeedbackCount>0){
                var mode = $filter('filter')($scope.modes, {type: 'feedback'})[0];
                mode.name = 'Teacher Feedback (' + $scope.newFeedbackCount + ')';
            }

            $scope.notifications= _.sortBy(n,function(n){return new Date(n.created)}).reverse();
        };
        var handleCurrentMode = function(){

        if (!$scope.$root.user.org.disallow_email){
            if($scope.newFeedbackCount>0){
                $scope.currentMode='feedback'
            } else {
                $scope.currentMode = 'sent'
            }
        }
        else
        {
            $scope.currentMode='feedback';     
        }
        };
        var refreshEmails = function(changeMode){
            Email.getAllEmails({},function(response){
                if(angular.isDefined(response.error))
                    return;
                if(angular.isDefined(response.emails)){
                    var emails = response.emails;
                    handleEmails(emails)
                }
                if(angular.isDefined(response.notifications)){
                    var notifications = response.notifications;
                    var teacher_notifications = response.teacher_notifications;
                    handleTeacherNotifications(notifications,teacher_notifications)
                }
                if(angular.isDefined(response.student_feedbacks)){
                    handleStudentNotifications(response.student_feedbacks)
                }
                if(angular.isDefined(changeMode)&& changeMode==true)
                    handleCurrentMode();
            });
        };
        refreshEmails(true);

        $scope.$watch('currentMode',function(type){

            if(type=='sent'){
                refreshEmails();
                var ids = []
                for(var i=0;i<$scope.unReadMessages.length;i++)
                    ids.push($scope.unReadMessages[i].id);
            }
            if(type=='feedback'){
                refreshEmails();
                var ids = []
                for(var i=0;i<$scope.unViewedFeedbacks.length;i++)
                    ids.push($scope.unViewedFeedbacks[i].id);
            }
        });


        $scope.showClasses=true;
        $scope.showUsers=true;

        $scope.ok = function(){
            $scope.ok_private($scope.userList)
        };
        $scope.markAsRead = function(message){
            if(message.type=='student_feedback'){
                Email.markStudentFeedbackAsViewed({ids:[message.id]});
                if(message.viewed==0) $scope.newStudentFeedbackCount=parseInt($scope.newStudentFeedbackCount)-1;
                message.viewed=1;
            }
            else if(message.teacher_feedback==1){
                Email.markTeacherFeedbackAsViewed({ids:[message.id]});
                if(message.viewed==0) $scope.newFeedbackCount=parseInt($scope.newFeedbackCount)-1;
                message.viewed=1;
            }
            else if(angular.isDefined(message.viewed) && message.layout=='QUIZ'){
                Email.markQuizFeedbackAsViewed({ids:[message.quiz_id]});
                if(message.viewed==0) $scope.newFeedbackCount=parseInt($scope.newFeedbackCount)-1;
                message.viewed=1;
            }
            else if(angular.isDefined(message.viewed) && message.layout=='FORUM'){
                Email.markForumFeedbackAsViewed({ids:[message.forumid]});
                if(message.viewed==0) $scope.newFeedbackCount=parseInt($scope.newFeedbackCount)-1;
                message.viewed=1;
            }
            else if(angular.isDefined(message.viewed)){

                Email.markFeedbackAsViewed({ids:[message.id]});
                if(message.viewed==0) $scope.newFeedbackCount=parseInt($scope.newFeedbackCount)-1;
                message.viewed=1;

            }
            else{
                Email.markAsRead({ids:[message.id]});
                if(message.read==0) $scope.newMessagesCount=parseInt($scope.newMessagesCount)-1;
                message.read=1;

            }

            $scope.$root.$broadcast('refreshCounter');
        };
        $scope.open = function (notification,isTeacher) {
            $scope.markAsRead(notification);
            var templateUrl,
                controller,
                windowClass;
            if(notification.layout=='QUIZ'){
                templateUrl = '/public/views/partials/notificationgradequiz.html'
                controller = 'NotificationQuizController'
                windowClass='feedback-quiz-modal'
            }
            if(notification.layout=='FORUM'){
                templateUrl = '/public/views/partials/notificationgradeforum.html'
                controller = 'NotificationForumController'
                windowClass='feedback-quiz-modal'
            }
            else if(notification.type=='student_feedback'){
                templateUrl = '/public/views/partials/notificationstudentfeedback.html'
                controller = 'NotificationStudentFeedbackController'
                windowClass='feedback-modal'
            }
            else{
                templateUrl = '/public/views/partials/notificationgradepost.html?cachesmash=5'
                controller = 'NotificationGradePostMessagesController'
                windowClass='feedback-modal'
            }

            $rootScope.feedbackModal = $modal.open({
                templateUrl: templateUrl,
                windowClass: windowClass,
                controller: controller,
                resolve: {
                    notification: function () {
                        return notification;
                    }
                }
            });
        };

        UserV2.getUser().then(function(me){
            $scope.me = me;
            $scope.classes = me.classes;
            $scope.classesAutoComplete = [];
            var courseId = CurrentCourseId.getCourseId();
            if(courseId!=0){
                current_class = _.findWhere($scope.classes,{courseId:parseInt(courseId)}) || _.findWhere($scope.classes,{id:courseId})
                $scope.selected_class = current_class.id;
            }

        });
        //Adding fname and lname. It is needed to keep the previous structure of the feature
        function addingFnameLname(users){
            _.each(users.students,function(user){
                user.fname =user.firstName;
                user.lname =user.lastName
            });
            _.each(users.teachers,function(user){
                user.fname =user.firstName;
                user.lname =user.lastName
            });
        }
        var setUsers = function(class_){
            $scope.isStudent = class_.isStudent;
            Class.getStudents({
                id:class_.id,
                includeGuardians:true
            },function(users){

                addingFnameLname(users);
                if(angular.isDefined( users.students)){
                    if(users.students.length==0){
                        var user = {fname:"No users in this class"}
                        users.students.push(user);
                    }
                    $scope.students=users.students;

                }else{
                    $scope.students=[]
                }

                if(angular.isDefined( users.teachers)){
                    if(users.teachers.length==0){
                        var user = {fname:"No users in this class"}
                        users.teachers.push(user);
                    }
                    $scope.teachers=users.teachers;
                }
                $scope.userList=[];

            })

        };
        $scope.addAll = function(users){
            for(var i in users)
                $scope.addUser(users[i]);
        };

        $scope.removeUser = function(user){
            $scope.userList.splice($scope.userList.indexOf(user),1);
        };
        $scope.addUser = function(user){
            if($scope.userList.indexOf(user)<0)
                $scope.userList.push(user);
            $scope.selected_user='';
        };
        $scope.$watch('selected_class',function(NewValue){
            var class_ = _.findWhere($scope.classes,{id:NewValue});
            if(angular.isDefined(class_))
                setUsers(class_);
        });
        $scope.$watch('selected_teacher',function(NewValue){
            var user = _.findWhere($scope.teachers,{id:NewValue});

            if(angular.isDefined(user)){
                user.is_teacher=true;
                $scope.addUser(user);
            }
        });
        $scope.$watch('selected_student',function(NewValue){
            var user = _.findWhere($scope.students,{id:NewValue});
            if(angular.isDefined(user))
                $scope.addUser(user);

        });

        $scope.cancel = function (){
            $modalInstance.dismiss('cancel');
        };


    }
]);


var appServices = angular.module('app.services');
appServices.factory('graderactivity', ['$timeout','$filter','GraderSortOrder', function ($timeout,$filter,GraderSortOrder) {

    return {
        content: {},
        contentCache: {},
        tmparray: new Array('contenthtml', 'pagename', 'is_mobile', 'allow_video_post', 'allow_text_post',
            'allow_upload_post', 'page_is_private', 'page_is_gradeable'),
        /*
         Golabs 02/02/2015
         This will add form data from grader comment to the object
         messageGradeComments id is the post id this is to capture
         the grade, teacher_notes and grade_comments so when
         the form is updates what ever was in forms is retained.
         calling file is gradercomment.html
         */
        addGradeComments: function ($scope, id, value, type) {
            $scope.messageGradeComments[id][type] = value;
        },

        setgraderAllows: function ($scope, $rootScope, $sce) {
            if (typeof content.contenthtml === 'undefined') {
                content.contenthtml = '';
            }
            for (var i = 0; i < this.tmparray.length; i++) {
                if (this.tmparray[i] === 'contenthtml')
                    continue;
                $scope[this.tmparray[i]] = this.content[this.tmparray[i]];
            }
            $rootScope.is_mobile = $scope.pagename;
            $scope.contenthtml = $sce.trustAsHtml(content.contenthtml);
            $scope.is_mobile = ON_MOBILE;
            this.contentcache = {};
            for (var i = 0; i < this.tmparray.length; i++) {
                this.contentCache[this.tmparray[i]] = $scope[this.tmparray[i]];
            }
        },

        /*
         returning content.
         */
        getgradercontent: function ($scope, $rootScope) {
            for (var i = 0; i < this.tmparray.length; i++) {
                if (typeof this.contentCache[this.tmparray[i]] !== 'undefined') {
                    //                $scope[this.tmparray[i]] = this.contentCache[this.tmparray[i]];
                }
            }
            if (typeof this.contentCache.pagename !== 'undefined') {
                // $rootScope.pagename = this.contentCache.pagename;
                //$scope.is_mobile = ON_MOBILE;
                return false;
            }
            return true;
        },

        /*
         Capturing cacheing our content.
         */
        setgradercontent: function ($scope, $rootScope, $sce, content) {
            this.content = content;
            this.setgraderAllows($scope, $rootScope, $sce)
            return;
        },

        /*
         Golabs 02/02/2015
         We need to hold form informaion for grade, teacher_notes and grade_comments
         when a refresh is done we will put in back in to the messages using the id
         This will populate the angular way " grade, teacher_notes and grade_comments" in gradercomment.html
         */
        gradeComments: function ($scope, messages) {
            if (typeof $scope.messageGradeComments === 'undefined' || messages.postmessages.length!=  $scope.messageGradeComments.length) {
                var id = 0;
                $scope.messageGradeComments = {}
                for (var i = 0; i < messages.postmessages.length; i++) {
                    id = messages.postmessages[i].id;
                    $scope.messageGradeComments[id] = {}
                    $scope.messageGradeComments[id].grade = parseInt(messages.postmessages[i].grade);
                    $scope.messageGradeComments[id].grade_comments = messages.postmessages[i].grade_comments;
                    $scope.messageGradeComments[id].teacher_notes = messages.postmessages[i].teacher_notes;

                    id = messages.postmessages[i].id;
                    if (typeof messages.postmessages[i].grade === 'undefined' || messages.postmessages[i].grade == null)
                        messages.postmessages[i].grade = '';

                    if (messages.postmessages[i].grade.match(/\d/))
                        messages.postmessages[i].grade = parseInt(messages.postmessages[i].grade)
                    if (typeof messages.postmessages[i].grade_comments === 'undefined')
                        messages.postmessages[i].grade_comments = '';
                    if (typeof messages.postmessages[i].teacher_notes === 'undefined')
                        messages.postmessages[i].teacher_notes = '';

                    if (messages.postmessages[i].video_url&&messages.postmessages[i].video_url.match(/\.mp4/)) {
                        messages.postmessages[i].hasvideo = true;
                    } else {
                        messages.postmessages[i].hasvideo = false;
                    }
                    // $scope.messageGradeComments[id] = {};
                }
            } else {
                for (var i = 0; i < messages.postmessages.length; i++) {
                    id = messages.postmessages[i].id;
                    messages.postmessages[i].grade = $scope.messageGradeComments[id].grade;
                    messages.postmessages[i].grade_comments = $scope.messageGradeComments[id].grade_comments;
                    messages.postmessages[i].teacher_notes = $scope.messageGradeComments[id].teacher_notes;
                    if (messages.postmessages[i].video_url.match(/\.mp4/)) {
                        messages.postmessages[i].hasvideo = true;
                    } else {
                        messages.postmessages[i].hasvideo = false;
                    }
                }
            }
        },
        createCKEDITOR: function (id) {
            $timeout(function () {
                CKEDITOR.config.allowedContent = true;
                CKEDITOR.config.disableNativeSpellChecker = false;
                var ck = CKEDITOR.replace('grade_comments_' + id, {

                    toolbar: [{
                        name: 'basicstyles',
                        groups: ['basicstyles', 'cleanup'],
                        items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat', 'Smiley']
                    }, {
                        name: 'paragraph',
                        groups: ['list', 'indent', 'blocks', 'align', 'bidi'],
                        items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
                    }, {
                        name: 'colors',
                        items: ['TextColor', 'BGColor']
                    }, {
                        name: 'tools',
                        items: ['Maximize']
                    }, ],
                    filebrowserUploadUrl: '/uploadckeditormedia/',
                    height: 200,
                });

                ck.on('paste', function (evt) {
                    var data = evt.data;

                    if (data.dataValue.match(/(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g)) {
                        data.dataValue = data.dataValue.replace(/(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g, '<iframe width="420" height="345" src="http://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');
                    } else if (data.dataValue.match(/((https|http)?:\/\/.*\.(?:png|jpg))/i)) {
                        data.dataValue = data.dataValue.replace(/((https|http)?:\/\/.*\.(?:png|jpg))/i, '<img src="$1" width="225" height="100" alt="alt description" title="image title" class="image_classes" />')
                    } else if (data.dataValue.match(/((https|http)?:\/\/.*\.(?:mp4|avi|ogv|webm))/g)) {
                        data.dataValue = data.dataValue.replace(/((https|http)?:\/\/.*\.(mp4|avi|ogv|ogg|webm))/g, '<video width="420" height="345" class="video-js vjs-default-skin" preload="none" controls><source src="$1" type="video/$3" /></video>')
                    } else if (data.dataValue.match(/((https|http)?:\/\/.*\.(?:swf))/g)) {
                        data.dataValue = data.dataValue.replace(/((https|http)?:\/\/.*\.(?:swf))/g, '<object width="420" height="345" data="$1"></object>')
                    } else
                        data.dataValue = data.dataValue.replace(
                            /((http|https):\/\/[^\s]+)/gi, '<a href="$1">$1</a>');
                    //                            // Text could be pasted, but you transformed it into HTML so update that.
                    data.type = 'html';
                });
            }, 500);

        },
        /*
         Golabs 2/2/2015
         We are setting currentMessageId so that
         we know what message to set active when  user clicks on
         a tab in grader.
         We will also set our postedMessages here.
         */
        clear:function(){
            this.postedMessages = [];
            this.allPostedMessages =[];
            this.allContentPostedMessages =[];
        },
        setPostedMessages: function ($scope, $rootScope, messages, $sce, $http) {
            if($scope.$root)
                $scope.$root.pageInfo = messages.page;
            this.quizzes = undefined;
            // If there is a teachers list, we need to do some pre-processing to add some missing fields to the messages array

            // Now set the teachers object which is used to select teachers in the top teacher filter
            if (messages['teachers']) {
                // We start by adding a full name for every teacher and adding distincet teachers into the distinctTeachers array
                var distinctTeachers = [];
                for (var i = 0; i < messages['teachers'].length; i++) {
                    messages['teachers'][i].name = messages['teachers'][i].fname + ' ' + messages['teachers'][i].lname;
                    var teacherAlreadyDistinct = true;
                    for (var j = 0; j < distinctTeachers.length; j++) {
                        if (distinctTeachers[j].user_id === messages['teachers'][i].user_id) {
                            teacherAlreadyDistinct = false;
                        }
                    }
                    if (teacherAlreadyDistinct) {
                        distinctTeachers.push(messages['teachers'][i])
                    }
                }
                // We then add the teachers array to the scope
                $scope.teachersThatHaveGraded = distinctTeachers;

                // Now add teacher ID to all of the posted messages
                for (var i = 0; i < messages.postmessages.length; i++) {

                    var teacherPostIdFromMessage = messages.postmessages[i].teacher_post_id;
                    for (var j = 0; j < messages['teachers'].length; j++) {
                        if (messages['teachers'][j].post_id == teacherPostIdFromMessage) {
                            messages.postmessages[i].teacher_user_id = messages['teachers'][j].user_id;
                        }
                    }
                }
            }

            if (typeof $rootScope.scrolltop !== 'undefined') {
                $(document).scrollTop($rootScope.scrolltop);
                delete $rootScope.scrolltop;
            }


            //$scope.postedMessages = new Array(); //So we can present a no feedback message.
            if (!_.isNull( messages.postmessages) && (typeof messages.postmessages === "object") && (typeof messages.postmessages[0] === "object")) {
                if (typeof $scope.currentMessageId === 'undefined')
                    $scope.currentMessageId = messages.postmessages[0].id;
                this.gradeComments($scope, messages);
                $scope.pagename = messages.postmessages[0].page_name;
                $scope.postedMessages = messages.postmessages;
                this.postedMessages = $scope.postedMessages;
                this.allContentPostedMessages = messages.postmessages;
                $scope.unitname = $rootScope.is_mobile;
                $scope.allow_video_post = 1;

                $scope.studentsNeedingGrading = messages.students

                for (var i = 0; i < $scope.postedMessages.length; i++) {
                     $scope.postedMessages[i].htmlSafe = $sce.trustAsHtml($scope.postedMessages.message);
                }
            }else{
                this.postedMessages = [];
            }
            this.prepareMessagesAndQuizzes($scope);

            if(messages.questionsAfterLeaveByStudents && messages.questionsAfterLeaveByStudents.length !== 0)
                this.addQuestionsAfterLeavePage($scope.postedMessages=$scope.postedMessages||[],messages.questionsAfterLeaveByStudents,messages)
        },
        addQuestionsAfterLeavePage:function(postedMessages,questionsByStudent,messages){
            for(var studentId in questionsByStudent){
                if(!questionsByStudent.hasOwnProperty(studentId)) continue;

                var messagesByStudentId = messagesIndexedByStudent(postedMessages);
                if(messagesByStudentId[studentId]){
                    updateStudentMessages(postedMessages,studentId,questionsByStudent,messages,messagesByStudentId)
                }else{
                    addToStudentMessages(questionsByStudent,studentId,messages,postedMessages)
                }
            }
            function messagesIndexedByStudent(postedMessages){
                var students = {};

                for(var i = 0; i<postedMessages.length;i++){
                    if(!students[postedMessages[i].user_id]){
                        students[postedMessages[i].user_id] = []
                    }
                    students[postedMessages[i].user_id].push(i)
                }
                return students;
            }
            function updateStudentMessages(postedMessages,studentId,questionsByStudent,messages,messagesByStudentId){
                postedMessages[0].grouped.unshift({isQuestion:true,id:'question'+studentId});
                postedMessages[0].message.morethenone = 1
                addToStudentMessages(questionsByStudent,studentId,messages,postedMessages, postedMessages[0].grouped,messagesByStudentId[studentId][0])
            }
            function addToStudentMessages(questionsByStudent,studentId,messages,postedMessages,grouped,index){
                var message = questionsByStudent[studentId]
                message.grouped =grouped||[{isQuestion:true,id:'question'+studentId}]
                message.page_name = messages.page.name
                message.unit_name = messages.page.unitName
                message.id='question'+studentId
                message.isQuestion=true;
                if(index)
                    postedMessages.splice(index,0,message)
                else postedMessages.push(message)
            }
        },
        /**
         $scope.applyStudentFilter is called right after the user makes a selection in the student filter. It will
         re-render the list of grading to only include grading for this student.
         @param scope the scope of the relevant grader controller.
         @param selectedStudent the object for the student that was selected in the filter.
         **/
        applyStudentFilter: function ($scope, selectedStudent) {
            if (selectedStudent) {
                // Compile a list of all posted messages that will still be visible after the student filter is applied.
                var newMessagesList = new Array();
                for (var i = 0; i < $scope.allPostedMessages.length; i++) {
                    if (this.getStudentIdFromMessage($scope.allPostedMessages[i]) == (selectedStudent.user_id || selectedStudent)) {
                        newMessagesList.push($scope.allPostedMessages[i]);
                    }
                }
                // Set current grading list to the new filtered list.
                this.postedMessages = newMessagesList;
                setTimeout(function(){$scope.$apply()});
            } else {
                // Restore full list of grading.
                this.postedMessages = $scope.allPostedMessages;
            }

        },
        updateRubrics:function($scope){
            $scope.reloadingRubric = true;
            setTimeout(function(){
                $scope.reloadingRubric = false;
                $scope.$apply()
            },100);
        },
        getStudentIdFromMessage:function (message){
            if(message.type && message.type=='quiz'){
                return message.quiz.user.user_id
            }else
                return message.user_id
        },
        applyStudentFilter2: function (selectedStudentId) {
            if (selectedStudentId) {
                // Compile a list of all posted messages that will still be visible after the student filter is applied.
                var newMessagesList = [];
                for (var i = 0; i < this.allPostedMessages.length; i++) {
                    if (this.getStudentIdFromMessage(this.allPostedMessages[i]) == selectedStudentId) {
                        newMessagesList.push(this.allPostedMessages[i]);
                    }
                }
                // Set current grading list to the new filtered list.
                this.postedMessages = newMessagesList;
            } else {
                // Restore full list of grading.
                this.postedMessages = this.allPostedMessages;
            }
        },
        applyActivityTypeFilter: function ($scope, selectedActivityType) {
            if (selectedActivityType) {
                // Compile a list of all posted messages that will still be visible after the activity type filter is applied.
                var newMessagesList = new Array();
                for (var i = 0; i < $scope.allPostedMessages.length; i++) {
                    switch (selectedActivityType) {
                        case 'video':
                            if ($scope.allPostedMessages[i].allow_video_post == '1') {
                                newMessagesList.push($scope.allPostedMessages[i])
                            }
                            break;
                        case 'text':
                            if ($scope.allPostedMessages[i].allow_text_post == '1') {
                                newMessagesList.push($scope.allPostedMessages[i])
                            }
                            break;
                        case 'upload':
                            if ($scope.allPostedMessages[i].allow_upload_post == '1') {
                                newMessagesList.push($scope.allPostedMessages[i])
                            }
                            break;
                    }
                }
                // Set current grading list to the new filtered list.
                $scope.postedMessages = newMessagesList;
                setTimeout(function(){$scope.$apply()});
            } else {
                // Restore full list of grading.
                $scope.postedMessages = $scope.allPostedMessages;
            }
        },
        /**
         $scope.applyTeacherFilter is called right after the user makes a selection in the teacher filter. It will
         re-render the list of grading to only include grading that the selected teacher has completed.
         @param scope the scope of the relevant grader controller.
         @param selectedTeacher the object for the student that was selected in the filter.
         **/
        applyTeacherFilter: function ($scope, selectedTeacher) {
            if (selectedTeacher) {
                setTimeout(function(){
                    var newMessagesList = new Array();
                    for (var i = 0; i < $scope.allPostedMessages.length; i++) {
                        if ($scope.allPostedMessages[i].teacher_id == selectedTeacher.user_id) {
                            newMessagesList.push($scope.allPostedMessages[i]);
                        }
                    }
                    // Set current grading list to the new filtered list.
                    $scope.postedMessages = newMessagesList;
                    setTimeout(function(){$scope.$apply()});
                }) // Compile a list of all posted messages that will still be visible after the teacher filter is applied.

            } else {
                // Restore full list of grading.
                $scope.postedMessages = $scope.allPostedMessages;
            }
        },
        applyStartDateFilter: function ($scope) {
            if(!document.getElementById('dateRangeForm')) return;

            var endDate = $scope.graderData.dateRange.max || '';
            var startDate = $scope.graderData.dateRange.min || '';
            if(_.isDate(endDate)){
                endDate = moment(endDate).format('MM/DD/YYYY');
            }
            if(_.isDate(startDate)){
                startDate = moment(startDate).format('MM/DD/YYYY');
            }
            if (startDate || endDate) {
                var self =this;
                setTimeout(function () {
                    if (startDate === "") {
                        startDate = "01/01/1970"
                    }
                    var startDateSelected = new Date(startDate + ' 00:00 am');
                    if (endDate === "") {
                        endDate = "01/01/2050"
                    }
                    var endDateSelected = new Date(endDate + ' 23:59');
                    // Compile a list of all posted messages that will still be visible after the teacher filter is applied.
                    var newMessagesList = new Array();
                    for (var i = 0; i < self.allPostedMessages.length; i++) {
                        var dateCreated = new Date(self.allPostedMessages[i].created);
                        if (dateCreated > startDateSelected && dateCreated < endDateSelected) {
                            newMessagesList.push(self.allPostedMessages[i]);
                        }
                    }
                    // Set current grading list to the new filtered list.

                    self.postedMessages = newMessagesList;
                    $scope && setTimeout(function(){$scope.$apply()})
                }, 30);

            } else {
                // Restore full list of grading.
                this.postedMessages = this.allPostedMessages;
                $scope && setTimeout(function(){$scope.$apply()})
            }
        },

        windowwatcher: function ($scope, $window) {
            /*
             Golabs 04/02/2015
             What we want to do is return the window size when the windows has been changed or on first entry
             We do this by binding our clientWindow to resize event
             We will then a watch on the scope for getHeight.
             We can then set and return function with manipulation like style which is found in
             ng-style="style()" in gradercontent.html
             */
            var clientWindow = angular.element($window);
            $scope.getHeight = function () {
                return clientWindow.innerHeight();
            };
            $scope.$watch($scope.getHeight, function (newValue, oldValue) {
                $scope.windowHeight = newValue;
                $scope.style = function () {
                    return {
                        //height: newValue - 120 + 'px'
                    };
                };
                $scope.styleDiv = function (morethenone) {
                    if (morethenone !== 0) {
                        return {
                            //  height: newValue - 260 + 'px'
                        };
                    } else {
                        return {
                            //'height': newValue - 260 + 'px',
                            //'border-top': '1px solid #ccc'
                        };
                    }

                };
            });
            //Binding our windows to resize event.
            clientWindow.bind('resize', function () {
                setTimeout(function(){$scope.$apply()});
            });
            /*
             Style end
             */
        },
        prepareMessagesAndQuizzes:function($scope){
            if(this.quizzes){
                if(GraderSortOrder.getMode()!='alphabet'){
                    this.allPostedMessages = $filter('orderBy')((this.allContentPostedMessages || []).concat(this.quizzes.needingGrade),function(p){
                        if(!p)
                            return new Date()
                        return new Date(p.created);
                    },GraderSortOrder.getMode()=='desc');
                }else{
                    this.allPostedMessages = $filter('orderBy')((this.allContentPostedMessages || []).concat(this.quizzes.needingGrade),function(p){
                        return p.fname;
                    });
                }

            }else{
                this.allPostedMessages = this.allContentPostedMessages;
            }
            if(this.forums){
                if(GraderSortOrder.getMode()!='alphabet'){
                    this.allPostedMessages = $filter('orderBy')((this.allPostedMessages).concat(this.forums.students),function(p){

                        if(!p)
                            return new Date();
                        p.pageInfo = p.pageInfo || {};
                        return new Date(p.created || p.pageInfo.created);
                    },GraderSortOrder.getMode()=='desc');
                }else{
                    this.allPostedMessages = $filter('orderBy')((this.allPostedMessages).concat(this.forums.students),function(p){
                        return p.fname;
                    });
                }
            }

            $scope.allPostedMessages = this.allPostedMessages;

            if($scope.graderData && $scope.graderData.currentSelectedStudentId && $scope.graderData.currentSelectedStudentId!= 'all' ){
                this.applyStudentFilter2($scope.graderData.currentSelectedStudentId)
                $scope.graderData.updateStudentActivities($scope.graderData.currentSelectedStudentId)
            }else{
                this.postedMessages = this.allPostedMessages;
            }

        }


    }
}]);
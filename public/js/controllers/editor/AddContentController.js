'use strict';



appControllers.controller('AddContentController',
    ['$rootScope',
        '$scope',
        '$sce',
        '$q',
        '$modal',
        '$stateParams',
        'CurrentUnitId',
        'EditPage',
        'QuizList',
        'StandardData',
        'CurrentCourseId',
        'Vocab',
        'EditCourse',
        'RubricService',
        '$timeout',
        'Page',
        'Class',
        'Assignment',
        'Alerts',
        'OrganizationV2',
        '$http',
        'Gradebook',
        'Categories',
        'Pagebackground',
        'TestbankTestService',
        function ($rootScope, $scope, $sce, $q, $modal, $stateParams, CurrentUnitId, EditPage, QuizList, StandardData, CurrentCourseId, Vocab, EditCourse, RubricService, $timeout, Page, Class, Assignment,Alerts,OrganizationV2,$http,Gradebook,Categories,Pagebackground,TestbankTestService) {

            getOrgPreferences();
            $scope.rubricService = RubricService;
            $scope.rubricService.data = _.clone(RubricService.initialData);
            $scope.page_title = '';
            $scope.taskType = '';
            $scope.taskDuration = '0';
            $scope.page_sub_title = '';
            $scope.page_type = '';

            //Thomas Griffiths 1/20/17
            $scope.useLayouts = false;
            $scope.cpLayoutId = 0;
            $scope.cpLayoutObj = {};
            $scope.ajaxcall =  function() {
                return $.ajax({
                    method: "POST",
                    url: "../contentPageLayouts/layout" + $scope.cpLayoutId + ".php",
                    data: {
                        cpLayoutJson: JSON.stringify($scope.cpLayoutObj)
                    }
                }).done(function (response) {
                    $scope.page_content = response;
                });
            };
            $scope.setcpLayoutId = function (cpLayoutId) {
                $scope.cpLayoutId = cpLayoutId;
            }

            $scope.page_content = '';
            $scope.external_link = '';
            $scope.use_rubric = '0';
            $scope.allow_video_post = false;
            $scope.allow_video_text_post = false;
            $scope.allow_text_post = false;
            $scope.allow_upload_post = false;
            $scope.allow_upload_only_post = false;
            $scope.allow_template_post = false;
            $scope.is_private_post = true;
            $scope.is_gradeable_post = false;
            $scope.keep_highest_score = false;
            $scope.hide_activity = false;
            $scope.show_archived_posts = false;
            $scope.disable_visual_indicators = false;
            $scope.hide_reply = false;
            $scope.journalGradingType='0';
            $scope.exemptStudents = null;
            $scope.orgPreferences = {};
            $scope.loading={};
            $scope.canvasTemplate = {};
            $scope.categories = null;
            $scope.category_id = null;
            $scope.courseId = CurrentCourseId.getCourseId();
            $scope.quizFilter={};
            $scope.Pagebackground = Pagebackground;
            $scope.can_doublecheck_cam_audio = false;
            $scope.vocab = {
                id: undefined
            };
            $scope.grade = {
                max_points: 0
            };
            $scope.scormConfig = {
                scorm_id : undefined
            };
            $scope.due_date = new Date().toLocaleDateString();
            $scope.buttons = {
                addPage: "Save Changes",
                exempt: "Exempt Students"
            };
            $http.get('/api/test/classes').then(function (result) {
                $scope.proficiency_classes = result.data;
            });

            var d = new Date();
            d.setHours(23);
            d.setMinutes(59);
            $scope.due_time = d;
            $scope.assignment_allowed_takes = 0;
            $scope.page_group = {
                id: 0,
                name: ''
            };
            $scope.subunits = new Array();

            var flashTextForButton = function (variable, flashText, timeout) {
                var normalText = $scope.buttons[variable];
                $scope.buttons[variable] = flashText;
                $timeout(function () {
                    $scope.buttons[variable] = normalText;
                }, timeout);
            };
            $scope.pageTypes = [{
                name: 'Grouping',
                id: 'sub_unit'
            }, {
                name: 'Page: Content',
                id: 'content'
            }, {
                name: 'Page: Journal',
                id: 'journal'
            }, {
                name: 'Page: External Link',
                id: 'external_link'
            }, {
                name: 'Page: Vocabulary',
                id: 'vocab'
            }, {
                name: 'Page: Quiz/Test',
                id: 'quiz'
            }, {
                name: 'Page: Survey/Pre-test',
                id: 'survey'
            }, {
                name: 'Page: Quiz List',
                id: 'quiz_list'
            }, {
                name: 'Page: Vocabulary Quiz',
                id: 'vocab_quiz'
            }, {
                name: 'Page: Lesson Specific Listening Activity',
                id: 'lesson_listening_activity'
            }, {
                name: 'Page: General Listening Practice',
                id: 'listening_practice'
            }, {
                name: 'Page: General Reading Practice',
                id: 'reading_practice'
            }, {
                name: 'Page: Timed Review',
                id: 'timed_review'
            }, {
                name: 'Page: Class Summary',
                id: 'class_summary'
            }, {
                name: 'Page: Additional User Information Form',
                id: 'user_info_form'
            }, {
                name: 'Page: Welcome',
                id: 'welcome'
            }, {
                name: 'Page: Take Picture',
                id: 'picture'
            } , {
                name: 'Page: Glossary',
                id: 'glossary'
            }, {
                name: 'Page: SCORM',
                id: 'scorm'
            }, {
                name: 'Page: Forum',
                id: 'forum'
            } ];
            $scope.quiz_select = '';
            $scope.time_limit = 0;
            $scope.allowed_takes = 0;
            $scope.password = '';

            // for listening activity
            $scope.listen_course = '';
            $scope.listen_lesson = '';
            $scope.listen_numEx = '';

            // for listening activity
            $scope.timed_id = '';
            $scope.timed_limit = '';
            $scope.timed_pause = '';
            $scope.timeReviewPrompts = [{
                "answer": '',
                "type": "text",
                "prompt": "",
                "audioFile": "",
                'new':true
            }];
            $scope.timed_title = '';
            $scope.timed_description = '';
            $scope.timed_instruction = '';


            // nimble knowledge things
            $scope.native_lang = '';
            $scope.target_lang = '';

            EditPage.getsubunits({
                unit_id: CurrentUnitId.getUnitId()
            }, function (subunits) {
                $scope.subunits = subunits.subunits;
                $scope.quizzes = subunits.quizzes;
                $scope.surveys = subunits.surveys;
                $scope.vocabGroups = subunits.vocab_groups;
                $scope.allowed_pages = $scope.getAllowedPages(subunits.allowed_pages);
                $scope.orgOptions = subunits.orgOptions;
                $scope.proficiencyAreas = subunits.proficiencyAreas;
                $scope.isProficiencyTest = subunits.isProficiencyTest;
                $scope.gradebookCategories = subunits.gradebookCategories;
                $scope.hasGlossary = subunits.hasGlossary;
                $scope.meta = {}
            });
            $scope.getAllowedPages = function (allowed_pages) {
                if (allowed_pages != "-1") {
                    return _.filter($scope.pageTypes, function (page) {
                        return page.id in allowed_pages;
                    });
                }
                return $scope.pageTypes;
            };
            $scope.hasAssignment = function () {
                if ($scope.allow_video_post == true || $scope.allow_video_text_post == true || $scope.allow_text_post == true || $scope.allow_upload_post == true|| $scope.allow_upload_only_post == true || $scope.allow_template_post == true) {
                    return true;
                }

                return false;
            };

            $scope.isContent = function () {
                if ($scope.page_type.id == 'content') {
                    return true;
                }

                return false;
            };

            $scope.isUsingLayouts = function () {
                return $scope.useLayouts;
            };

            $scope.setUseLayouts = function(bool) {
                $scope.useLayouts = bool;
            };

            $scope.isExternalLink = function () {
                if ($scope.page_type.id === 'external_link') {
                    return true;
                }

                return false;
            };
            $scope.getVocabs = function (all) {
                if (all) {
                    EditCourse.get({
                        courseId: CurrentCourseId.getCourseId()
                    }, function (response) {
                        Vocab.all({
                            language: response.course.native_language
                        }, function (vocabs) {
                            $scope.vocabs = vocabs[0].vocabs;
                        });
                    });
                } else {
                    Vocab.byUnit({
                        id: CurrentUnitId.getUnitId()
                    }, function (vocabs) {
                        $scope.vocabs = vocabs;
                    });
                }

            };

            $scope.isNimble = function () {
                var nimbles = ['lesson_listening_activity', 'listening_practice', 'reading_practice']
                return nimbles.indexOf($scope.page_type.id) !== -1;
            };

            $scope.isLessonListening = function () {
                return $scope.page_type.id === 'lesson_listening_activity';
            };

            $scope.isTimedReview = function () {
                return $scope.page_type.id === 'timed_review';
            };
            $scope.isForum = function () {
                return $scope.page_type.id === 'forum';
            };
            $scope.isWelcome = function () {
                return $scope.page_type.id === 'welcome';
            };
            $scope.isJournal = function () {
                return ($scope.page_type.id === 'journal');
            };
            $scope.isQuizPageType = $scope.isQuiz = function () {
                return ($scope.page_type.id === 'quiz');
            };
            $scope.isVocabPageType = function () {
                return ($scope.page_type.id === 'vocab');
            };
            $scope.isTakePicture = function () {
                return ($scope.page_type.id === 'picture');
            };
            $scope.isUserForm = function () {
                return ($scope.page_type.id === 'user_info_form');
            };
            $scope.isVocabQuizPageType = function () {
                return ($scope.page_type.id === 'vocab_quiz');
            };
            $scope.isShowSubmissionTypeCheckboxes = function (){
                return ($scope.page_type.id.toLowerCase() !== 'quiz')&&
                    ($scope.page_type.id.toLowerCase() !== 'vocab') &&
                    ($scope.page_type.id.toLowerCase() !== 'vocab_quiz') &&
                    ($scope.page_type.id.toLowerCase() !== 'journal') &&
                    ($scope.page_type.id.toLowerCase() !== 'external_link') &&
                    ($scope.page_type.toLowerCase() !== 'forum');
            }
            $scope.isQuizListPageType = function () {
                return ($scope.page_type.id === 'quiz_list');
            };
            $scope.isScormPageType = function () {
                return ($scope.page_type.id === 'scorm');
            };
            $scope.isShowQuizSelector = function () {
                return ($scope.page_type.id === 'quiz');
            };
            $scope.isShowGlossarySelector = function () {
                return ($scope.page_type.id === 'glossary');
            };
            $scope.isShowSurveySelector = function () {
                return ($scope.page_type.id === 'survey');
            };
            $scope.isShowVocabQuizSelector = function () {
                return ($scope.page_type.id === 'vocab_quiz');
            };
            $scope.isShowPreviewQuizList = function () {
                return ($scope.page_type.id === 'quiz_list');
            };
            $scope.isShowPageTitleField = function () {
                return ($scope.page_type);
            };

            $scope.isShowPageSubTitleField = function () {
                return ($scope.page_type);
            };

            $scope.isShowSubmissionTypeCheckboxes = function () {
                return ($scope.page_type) &&
                    ($scope.page_type.id !== 'survey') &&
                    ($scope.page_type.id !== 'quiz_list') &&
                    ($scope.page_type.id !== 'quiz') &&
                    ($scope.page_type.id !== 'vocab') &&
                    ($scope.page_type.id !== 'vocab_quiz') &&
                    ($scope.page_type.id !== 'external_link') &&
                    ($scope.page_type.id !== 'sub_unit') &&
                    ($scope.page_type.id !== 'journal');
            };

            $scope.isShowPageGroupingSelector = function () {
                return ($scope.page_type) &&
                    ($scope.page_type.id !== 'sub_unit');
            };

            $scope.incrementMaxpoints = function (points) {
                if (angular.isDefined(points)) {
                    $scope[points] = $scope[points] || 0;
                    $scope[points] ++;
                } else
                    $scope.grade.max_points++;
            };

            $scope.decrementMaxpoints = function (points) {
                if (angular.isDefined(points)) {
                    $scope[points] = $scope[points] || 0;
                    $scope[points] --;
                } else
                    $scope.grade.max_points--;
            };
            function initVariables(){
                $scope.no_due_date = $scope.cloningId?$scope.no_due_date:true;
                if($scope.isTimedReview()){
                    $scope.require_submission = true;
                    $scope.allow_submission='video';
                    $scope.hide_reply = true;
                }
                if(CurrentCourseId.data.orgId=='10') //hard code for edkey
                    $scope.hide_reply = true;
                if(CurrentCourseId.data.orgId=='10') //hard code for edkey
                    $scope.keep_highest_score = true;
                if($scope.isForum()){
                    $scope.forumSettings = $scope.forumSettings || {
                            "type": "standard",
                            "subscription_mode": "auto",
                            "track_reading": "optional",
                            "limit_editing_time":0
                        }
                }
                if($scope.isQuiz()){
                    $scope.meta = $scope.meta || {};
                    $scope.meta.new_post_color = 'btn-primary btn-post'
                }
                if($scope.isTakePicture()){
                    $scope.meta = $scope.meta || {};
                    $scope.allow_submission = 'file_only';
                    $scope.require_submission = true;
                    $scope.hide_reply = true;
                    $scope.new_post_text = 'Take Picture';
                    $scope.meta.new_post_color = 'btn-primary btn-post'
                }
                if($scope.isUserForm()){
                    $scope.meta = $scope.meta || {};
                    $scope.require_submission = true;
                    $scope.allow_submission = 'text';
                    $scope.hide_reply = true;

                    $scope.new_post_text = 'Submit';
                    $scope.meta.new_post_color = 'btn-primary btn-post'
                    $scope.meta.nationality = true;
                    $scope.meta.language = true;
                }
                if($scope.isTakePicture()){
                    $scope.meta = $scope.meta || {};
                    $scope.allow_submission = 'file_only';
                    $scope.require_submission = true;
                    $scope.hide_reply = true;
                    $scope.new_post_text = 'Take Picture';
                    $scope.meta.new_post_color = 'btn-primary btn-post'
                }
            }
            function handleAutoGradePoints() {
                if ($scope.use_rubric != 2)
                    return;
                $scope.max_points_main = $scope.max_points_main || 0;
                $scope.max_points_reply = $scope.max_points_reply || 0;
                $scope.grade.max_points = $scope.max_points_reply + $scope.max_points_main;
            }
            function handleMaxPointsInput(value,oldValue){
                if(value && value!='1'){
                    $scope.rubricService.data.selected=0
                    if(value==2)
                        handleAutoGradePoints();
                    else
                        $scope.grade.max_points=0;
                }
            }
            $scope.filterQuizzes=function(item){
                return true;
            }

            $scope.$watch('max_points_reply', handleAutoGradePoints);
            $scope.$watch('max_points_main', handleAutoGradePoints);
            $scope.$watch('page_type', initVariables);
            $scope.$watch('use_rubric',handleMaxPointsInput);
            $scope.$watch('isGradeable',function(isGradeable){
                if(!isGradeable || $scope.categories || !currentClass) return;
                Categories.class.get(
                    {classId:currentClass[0].id},function(c){
                        $scope.categories = c
                        console.log($scope.categories)
                    }
                )
            });
            $scope.$watch('meta.backgroundUrl', function(url) {
                if(url){
                    $rootScope.backgroundUrl = $rootScope.backgroundUrl || {}
                    $rootScope.backgroundUrl[$rootScope.$stateParams.contentId]=$scope.meta.backgroundUrl
                }
            })
            $scope.$watch('quizFilter.flag', function(only_course_quizzes) {
                if(only_course_quizzes===undefined) return;
                if(only_course_quizzes)
                    $scope.filterQuizzes=function(item){
                        return $scope.courseId==item.course_id;
                    }
                else $scope.filterQuizzes=function(item){
                    return true;
                }
            });



            $scope.previewQuizList = function () {
                QuizList.list({
                    search: $scope.searchquiz
                }, function (response) {
                    $scope.previewQuizzes = response.quizzes;
                });
            };

            $scope.$on('rubricSaved', function () {
                $scope.addPage();
            });
            $scope.openTimedGroupEditor = function () {
                var modalInstance   = $modal.open({
                    templateUrl:'/public/views/timed-review/editor/timed-prompt-groups-modal.html',
                    controller: function($scope,$modalInstance,courseInfo){
                        $rootScope.promptsSidebarCollapsed = false;
                        $scope.cancel=function(){$modalInstance.dismiss('cancel')}
                        $rootScope.togglePromptsSidebar = function () {
                            if(!$rootScope.promptsSidebarCollapsed && $(window).width()>767){
                                $(".timed-groups-content-wrapper").css("cssText", "width: 100% !important");
                            }else{
                                $(".timed-groups-content-wrapper").css("cssText", "height :100%");
                            }
                            $rootScope.promptsSidebarCollapsed = !$rootScope.promptsSidebarCollapsed;
                        };
                        $scope.$root.courseInfo=courseInfo;

                    },
                    size: 'lg',
                    windowClass: 'timed-group-editor',
                    resolve: {
                        courseInfo: function(){return $scope.courseInfo},
                    }
                })
            }
            $scope.openCreateQuiz = function () {
                var modalInstance   = $modal.open({
                    templateUrl:'/public/views/directives/quiz-editor/modals/quiz.create.html',
                    controller: 'ModalCreateQuizController',
                    windowClass: 'create-quiz',
                }).result.then(function(resp){
                    var quiz = {
                        id:resp.test.id,
                        title:resp.test.title,
                        disabled:false,
                        questions:0,
                        is_survey:$scope.isShowSurveySelector()
                    }
                    $scope.quizzes.push(quiz)
                    $scope.surveys.push(quiz)
                    $scope.quiz_select = quiz;
                    if($scope.isShowSurveySelector()){
                        TestbankTestService.make_survey(quiz.id,{
                            is_survey:true
                        })
                    }
                })
            }
            function openCloneQuizFlag(){
                var defer = $q.defer()
                var modalInstance = $modal.open({
                    templateUrl: '/public/views/partials/modalclonequizzesflag.html',
                    controller: 'CloneQuizzesFlagController',

                });
                modalInstance.result.then(function(cloneQuizzes){
                    defer.resolve(cloneQuizzes);
                });
                return defer.promise;
            }
            function openClonePromptsFlag(){
                var defer = $q.defer()
                var modalInstance = $modal.open({
                    templateUrl: '/public/views/partials/modalclonepromptsflag.html',
                    controller: 'ClonePromptsFlagController',

                });
                modalInstance.result.then(function(clonePrompts){
                    defer.resolve(clonePrompts);
                });
                return defer.promise;
            }
            $scope.openTemplatePreview = function (template) {
                var modalInstance   = $modal.open({
                    templateUrl: '/public/views/partials/TemplateModalSubmissions.html',
                    controller: 'TemplateModalSubmissionsController',
                    size: 'lg',
                    resolve: {
                        rawHtml: function () {
                            return $scope.rawHtml;
                        },
                        template: function () {
                            return template;
                        }
                    }
                });

                modalInstance.result.then(function (response) {

                    $scope.selectedTemplate = response

                }, function () {

                });

            };

            $scope.getHtmlTemplate = function(template){
                $scope.openTemplatePreview(template);
            }

            function openScormUpload() {
                var defer = $q.defer();
                var modalInstance   = $modal.open({
                    templateUrl:'/public/views/directives/scorm/modal/upload-scorm.html',
                    controller: 'ModalUploadScormController',
                    scope: $scope
                });
                modalInstance.result.then(function(uploadScorm){
                    defer.resolve(uploadScorm);
                });
                return defer.promise;
            }

            $scope.$watch('allow_submission', function() {
                if ($scope.allow_submission === 'template'){
                    if($scope.use_rubric=='2')
                        $scope.use_rubric='0';
                    $scope.show_template_buttons = true;
                    //$scope.getHtmlTemplate($scope.selectedTemplate);
                    //
                    //$(".modal").draggable({
                    //    handle: ".modal-header"
                    //});

                }else{
                    $scope.show_template_buttons = false;
                }
            });
            $scope.useGradebookCategory = function(){
                return $scope.isGradeable() && $scope.gradebookCategories && $scope.gradebookCategories.length>1;
            };
            function checkGradebookCategoryIfNeeded(){
                var defer = $q.defer();
                if($scope.useGradebookCategory() && $scope.category_id==null){
                    Alerts.warning({
                        title: 'Unassigned gradeable activity',
                        content:'You have not assigned this activity to a gradebook category. Would you like to continue?',
                        textOk: 'Save',
                        textCancel:'Cancel'
                    },function(){
                        defer.resolve()
                    },function(){
                        defer.reject()
                    });
                }else{
                    defer.resolve();
                }
                return defer.promise;
            }
            $scope.addPage = function (recalculate,cloneQuizzes,clonePrompts) {
                console.log('?????????????');
                if($scope.limited_post_page==1&&($scope.post_limit<=0 ||$scope.post_limit==null) )
                {
                    alert("limited number of post should not be zero or empty");
                    return;
                }
                if($scope.page_type.id=='timed_review'){
                    for(var i=0;$scope.timeReviewPrompts.length>i;i++) {
                        var tmpPrompt = $scope.timeReviewPrompts[i];
                        if(tmpPrompt.type=="promptFromGroup"&&(!tmpPrompt.selected||!tmpPrompt.selected.group||!tmpPrompt.selected.prompt)){
                            errorMessage("Please select group and prompt properly in (Prompt-"+(i+1)+")");
                            return;
                        } else if(tmpPrompt.type=="randomFromGroup"&&(!tmpPrompt.selected||!tmpPrompt.selected.group)){
                            errorMessage("Please select a group properly in (Prompt-"+(i+1)+")");
                            return;
                        } else if(tmpPrompt.type=="text"&&tmpPrompt.prompt==""){
                            errorMessage("Please enter a question in (Prompt-"+(i+1)+")");
                            return;
                        } else if(tmpPrompt.type=="audio"&&(!tmpPrompt.audioFile||tmpPrompt.audioFile=="")){
                            errorMessage("Please upload or record a audio in (Prompt-"+(i+1)+")");
                            return;
                        } else if(tmpPrompt.type=="video"&&!tmpPrompt.videoFile){
                            errorMessage("Please upload or record a video in (Prompt-"+(i+1)+")");
                            return;
                        }
                    }
                }
                function errorMessage(data){
                    Alerts.danger({
                        title:'Page could not be saved',
                        content:data,
                        textOk:'Ok'
                    },function(){});
                }
                if(!recalculate && $scope.navService.navData.orgDetails.calculate_progress
                    && ($scope.is_gradeable_post || $scope.page_type.id.indexOf('quiz')>=0)
                ){
                    $scope.addPage('now')
                }else{
                    if($scope.cloningId && $scope.page_type.id=='quiz' && cloneQuizzes === undefined){
                        openCloneQuizFlag().then(function(cloneQuizzes) {
                            $scope.addPage(recalculate, cloneQuizzes)
                        })
                        return;
                    }
                    if($scope.cloningId && $scope.page_type.id=='timed_review' && clonePrompts === undefined){
                        openClonePromptsFlag().then(function(clonePrompts) {
                            $scope.addPage(recalculate, cloneQuizzes,clonePrompts)
                        })
                        return;
                    }

                    if (angular.isDefined($scope.rubricService.data.has_changes) && $scope.rubricService.data.has_changes) {
                        var resp = confirm("You have unsaved rubric changes. They will be automatically saved. Do you want to proceed?");
                        if (!resp) {
                            return;
                        }
                        $scope.$emit('saveRubric', {
                            savePage: true
                        });
                        return;
                    }
                    if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                        $scope.page_content = CKEDITOR.instances.editor1.getData().replace(/\n/g,'');
                    }

                    var page_group_id = 0;

                    if (angular.isDefined($scope.page_group.id) && $scope.page_group.id > 0) {
                        page_group_id = $scope.page_group.id;
                    }

                    var allow_video_post = 0,
                        allow_text_post = 0,
                        allow_video_text_post = 0,
                        allow_submission= 0,
                        allow_upload_post = 0,
                        allow_upload_only_post = 0,
                        allow_template_post = 0,
                        is_private_post = 0,
                        is_cant_leave= 0,
                        is_gradeable_post = 0,
                        keep_highest_score=0,
                        automatically_grade = 0,
                        hide_activity = 0,
                        show_archived_posts = 0,
                        disable_visual_indicators = 0,
                        hide_reply = 0,
                        show_objectives = 0,
                        show_score_per_standard= 0,
                        show_mastery= 0,
                        mastery_percentage= 0,
                        show_created_date = 0,
                        survey_points = 0,
                        minimum_score = "",
                        autograde_options = {};
                    if($scope.page_type.id === 'journal'){
                        allow_text_post = 1;
                    }

                    if($scope.allowed_takes<0){
                        Alerts.danger({
                            title:'Page could not be saved',
                            content:'Allowed takes must be greater than 0',
                            textOk:'Ok'
                        },function(){});

                        return;
                    }
                    if($scope.time_limit<0){
                        Alerts.danger({
                            title:'Page could not be saved',
                            content:'Time limit must be greater than 0',
                            textOk:'Ok'
                        },function(){});
                        return;
                    }

                    switch ($scope.allow_submission) {
                        case 'video':
                            allow_video_post = 1;
                            break;
                        case 'text':
                            allow_text_post = 1;
                            break;
                        case 'file':
                            allow_upload_post = 1;
                            break;
                        case 'file_only':
                            allow_upload_only_post = 1;
                            break;
                        case 'template':
                            allow_template_post = 1;
                            break;
                        case 'video_text':
                            allow_video_text_post = 1;
                            break;
                    }

                    if(!$scope.allow_submission && $scope.require_submission){
                        Alerts.danger({
                            title:'Page could not be saved',
                            content:'Please select a type of submission or make this page require no submission',
                            textOk:'Ok'
                        },function(){});

                        return;
                    }

                    if ($scope.show_created_date == true) {
                        show_created_date = 1;
                    }
                    if ($scope.show_objectives == true) {
                        show_objectives = 1;
                    }
                    mastery_percentage = $scope.mastery_percentage;
                    if ($scope.show_mastery == true) {
                        show_mastery = 1;
                    }
                    if ($scope.show_score_per_standard == true) {
                        show_score_per_standard = 1;
                    }


                    if ($scope.is_private_post == true) {
                        is_private_post = 1;
                    }
                    if ($scope.is_cant_leave == true) {
                        is_cant_leave = 1;
                    }

                    if ($scope.is_gradeable_post == true) {
                        is_gradeable_post = 1;
                    }

                    if ($scope.keep_highest_score == true) {
                        keep_highest_score = 1;
                    }

                    if ($scope.hide_activity == true) {
                        hide_activity = 1;
                    }
                    if ($scope.show_archived_posts == true) {
                        show_archived_posts = 1;
                    }
                    if ($scope.disable_visual_indicators == true) {
                        disable_visual_indicators = 1;
                    }
                    if ($scope.hide_reply == true) {
                        hide_reply = 1;
                    }
                    if ($scope.use_rubric == '2') {
                        automatically_grade = 1;
                        autograde_options = {
                            main_max_points: $scope.max_points_main || 0,
                            main_per_post: $scope.points_main || 0,
                            reply_max_points: $scope.max_points_reply || 0,
                            reply_per_post: $scope.points_reply || 0
                        };
                    }

                    if ($scope.page_type == 'external_link') {
                        $scope.page_content = $scope.external_link;
                    } else if ($scope.page_type == 'vocabulary') {
                        $scope.page_content = '';
                    }

                    var quizId = null;
                    if ($scope.quiz_select) {
                        quizId = parseInt($scope.quiz_select.id);
                    }
                    var vocabId = null;
                    if ($scope.vocabGroupSelect) {
                        vocabId = parseInt($scope.vocabGroupSelect.moduleid);
                    }
                    if (angular.isDefined($scope.vocab.id)) {
                        vocabId = parseInt($scope.vocab.id);
                    }

                    var rubricId = 0;
                    if ($scope.rubricService.data.selected != 0 && $scope.use_rubric == '1') {
                        if($scope.rubricService.data.selected)
                            rubricId = $scope.rubricService.data.selected.id
                        else rubricId=$scope.rubricService.data.selected_id ;

                    }

                    if ($scope.no_due_date) {
                        $scope.due_date = new Date();
                        $scope.due_time = new Date();
                    }
                    if ($scope.isQuizListPageType()) {
                        $scope.allowed_takes = 1;
                    }
                    var meta = _.extend({},$scope.meta);
                    for (var i in autograde_options) {
                        meta[i] = autograde_options[i];
                    }

                    meta.is_lesson=$scope.is_lesson?1:0;
                    meta.limited_post_page=$scope.limited_post_page?1:0;
                    meta.post_limit=$scope.limited_post_page && $scope.post_limit?$scope.post_limit:0;
                    meta.exclude_from_gradebook=$scope.exclude_from_gradebook;
                    meta.append_timed_prompts=$scope.append_timed_prompts;

                    if ($scope.use_color && $scope.page_border_color)
                        meta.page_border_color = $scope.page_border_color;
                    else
                        meta.page_border_color = false;

                    var date = new Date($scope.due_date);
                    var time = new Date($scope.due_time);

                    var finishSaving = function(id){
                        $scope.loading.addPage = 0;
                        $scope.$broadcast('saveStandard', {
                            id: id
                        });
                        $rootScope.$broadcast('NavForceReload');
                        flashTextForButton('addPage', 'Saved!', 1000);
                        if($scope.page_type.id == 'sub_unit')
                        {
                            $scope.$state.go(
                                'editheader',
                                {
                                    'contentId':id
                                },
                                {
                                    location:true
                                }
                            )
                        }

                        $scope.$state.go(
                            'edit' + $scope.page_type.id,
                            {
                                'contentId':id
                            },
                            {
                                location:true
                            }
                        )
                    };
                    date.setHours(time.getHours());
                    date.setMinutes(time.getMinutes());
                    if($scope.is_gate){
                        minimum_score=$scope.minimum_score;
                    }
                    survey_points = $scope.survey_points;
                    $scope.loading.addPage = 1;
                    $scope.selectedTemplate = $scope.selectedTemplate || {}
                    console.log('calling...');

                    //back up just in case the submit happens before cpLayoutObj is updated
                    if($scope.isUsingLayouts()) {
                        for (var instance in CKEDITOR.instances) {
                            var prev = $("#cke_" + instance).prev();
                            if (prev.attr("ng-model")) {
                                var ngModel = prev.attr("ng-model");
                                var property = ngModel.split(".")[1];
                                $scope.cpLayoutObj[property] = CKEDITOR.instances[instance].getData().replace(/\n/g, '');
                            }
                        }
                    }

                    var promise;
                    if($scope.isUsingLayouts()) promise = $scope.ajaxcall();
                    else promise = $q.when(false);

                    if ($scope.isScormPageType()) {
                        promise = openScormUpload();
                    }

                    promise.then(function() {

                    checkGradebookCategoryIfNeeded().then(function(){
                       EditPage.submit({
                            recalculate:recalculate,
                            cloningId:$scope.cloningId,
                            cloneQuizzes:cloneQuizzes,
                            unit_id: CurrentUnitId.getUnitId(),
                            page_title: $scope.page_title,
                            external_id:$scope.external_id,
                            export_id:$scope.export_id,
                            page_sub_title: $scope.page_sub_title,
                            journalGradingType:$scope.journalGradingType,
                            page_group_id: page_group_id,
                            page_type: $scope.page_type.id,
                            page_content: $scope.page_content,

                            allow_video_post: allow_video_post,
                            allow_video_text_post: allow_video_text_post,
                            allow_text_post: allow_text_post,
                            allow_upload_post: allow_upload_post,
                            allow_upload_only_post: allow_upload_only_post,
                            allow_template_post: allow_template_post,
                            is_private_post: is_private_post,
                            is_cant_leave: is_cant_leave,
                            is_gradeable_post: is_gradeable_post,
                            keep_highest_score :keep_highest_score,
                            automatically_grade: automatically_grade,
                            hide_activity: hide_activity,
                            show_archived_posts: show_archived_posts,
                            disable_visual_indicators: disable_visual_indicators,
                            hide_reply: hide_reply,
                            show_objectives: show_objectives,
                            show_score_per_standard:show_score_per_standard,
                            show_created_date: show_created_date,
                            task_type: $scope.taskType,
                            task_duration: $scope.taskDuration,
                            due_date: date.toLocaleString(),
                            no_due_date: $scope.no_due_date || 0,
                            max_points: $scope.grade.max_points,
                            survey_points:survey_points,
                            minimum_score_for_completion:$scope.minimum_score_for_completion,
                            assignment_allowed_takes: $scope.assignment_allowed_takes,
                            quiz_id: quizId,
                            vocabId: vocabId,
                            vocab_config: $scope.vocabOptions,
                            rubricId: rubricId,

                            time_limit: $scope.time_limit,
                            allowed_takes: $scope.allowed_takes,
                            password: $scope.meta.auto_start?'':$scope.password,
                            searchquiz: $scope.searchquiz,
                            objective: $scope.objective,
                            gradebook_category_id: $scope.category_id,
                            new_post_text: $scope.new_post_text,

                            gate: $scope.is_gate,
                            double_check_cam_audio: $scope.can_doublecheck_cam_audio,
                            no_menu_go_back: $scope.no_menu_go_back,
                            minimum_score: minimum_score,
                            // listening activity
                            listen_course: $scope.listen_course,
                            listen_lesson: $scope.listen_lesson,
                            listen_numEx: $scope.listen_numEx,

                            // listening activity
                            timed_id: $scope.timed_id,
                            timed_limit: $scope.timed_limit,
                            timed_pause: $scope.timed_pause,
                            timed_prepare: $scope.timed_prepare,
                            timed_prompts: $scope.timeReviewPrompts,
                            timed_title: $scope.timed_title,
                            timed_description: $scope.timed_description,
                            timed_instruction: $scope.timed_instruction,


                            // nimble knowledge things
                            native_lang: $scope.native_lang,
                            target_lang: $scope.target_lang,
                            meta: meta,
                            exempt: ($scope.canExempt())? $scope.exemptStudents : null,
                            template:$scope.canvasTemplate.id,
                           scorm_config: $scope.scormConfig,

                            forumSettings:$scope.forumSettings,

                            clonePrompts: true
                            }, function (page) {
                                if (page.message == 'successful') {
                                    if($scope.exemptStudents) {
                                        Page.get(
                                            {id:page.id},
                                            function(currentPage) {
                                                Class.query({unitId: $stateParams.unitId}, function(currentClass){
                                                    Assignment.updateExempt(
                                                        {
                                                            classId: currentClass[0].id,
                                                            assignmentId: currentPage.assignmentId,
                                                            students: $scope.exemptStudents
                                                        },
                                                        function(){
                                                            finishSaving(page.id);
                                                        }
                                                    );
                                                });
                                            }
                                        );
                                    } else {
                                        finishSaving(page.id);
                                    }
                                } else {
                                    $scope.loading.addPage = 2;
                                    Alerts.danger({
                                        title:'Page could not be saved',
                                        content:page.message,
                                        textOk:'Ok'
                                    },function(){});
                                }
                            },function(error){
                                $scope.loading.addPage=2;
                                Alerts.danger({
                                    title:'Changes could not be saved',
                                    content:error.statusText,
                                    textOk:'Ok'
                                },function(){});

                            });
                        },function(){
                        $scope.loading.addPage = 2
                    });
                    });
                }


            };
            $scope.isGradeable = function(){
                if(!$scope.page_type) return;
                return (['quiz','quiz_list','vocab_quiz'].indexOf($scope.page_type.id) > -1) || $scope.is_gradeable_post;
            }
            $scope.canHideContent = function () {
                if(!$scope.page_type) return true;
                return (['sub_unit','journal','external_link','vocab','lesson_listening_activity','listening_practice','reading_practice','class_summary'].indexOf($scope.page_type.id) > -1)
            };
            $scope.isProficiencyClass = function () {
                var result = _.findWhere($scope.proficiency_classes, {id: CurrentCourseId.data.classId});
                return result!=undefined;
            }
            $scope.openExemptModal = function(){
                $modal.open({
                    templateUrl: '/public/views/partials/editor/exemptstudents.html',
                    controller: 'ExemptStudentsModalController',
                    size: 'lg',
                    resolve: {
                        newPage: function(){
                            return true;
                        },
                        currentClass: function(){
                            return Class.query({unitId: $stateParams.unitId}).$promise;
                        },
                        exempt: function(){
                            return angular.copy($scope.exemptStudents);
                        }
                    }
                }).result.then(function (students) {
                        $scope.exemptStudents = students;
                    });
            };


            $scope.canExempt = function() {
                if(!$scope.page_type) {
                    return false;
                }
                var exemptable = ['quiz','quiz_list','vocab_quiz'];
                return (exemptable.indexOf($scope.page_type.id) > -1) || $scope.is_gradeable_post;
            };

            $scope.$on('clonedInfo', function (event, page) {
                $scope.survey={};
                $scope.gate = {};
                $scope.quiz_select = $scope.quiz_select || {}
                $scope.cloningId = page.id
                $scope.quiz_select.id = page.quiz_id
                $scope.page_title = page.name;
                $scope.journalGradingType = page.journal_grading_type;
                $scope.canvasTemplate = page.canvasTemplate || {}
                $scope.page_sub_title = page.subtitle;
                $scope.vocab_config = page.vocab_config;

                $scope.searchquiz = page.searchquiz;
                $scope.objective = page.objective;
                $scope.new_post_text = page.new_post_text;
                $scope.taskType = page.task_type;
                $scope.taskDuration = page.task_duration;

                $scope.page_content = page.content;
                $scope.vocab = {id:page.moduleid}

                $scope.allow_submission=false;
                if(page.allow_video_post=="1")
                    $scope.allow_submission='video'
                if(page.allow_video_text_post=="1")
                    $scope.allow_submission='video_text'
                else if (page.allow_text_post=="1")
                    $scope.allow_submission='text'
                else if (page.allow_upload_post=="1")
                    $scope.allow_submission='file'
                else if (page.allow_upload_only_post=="1")
                    $scope.allow_submission='file_only'
                else if (page.allow_template_post=="1"){
                    $scope.allow_submission='template';
                    $scope.show_template_buttons = true;
                    $scope.selectedTemplate = page.template;
                }


                if ($scope.allow_submission) $scope.require_submission = true;

                if (page.time_review_data) {
                    $scope.timeReviewPrompts = page.time_review_data;
                    //console.log($scope.timeReviewPrompts);
                }
                $scope.$broadcast('fetchedReviewPrompts', page);

                $scope.quizInfo = page.quizInfo;

                if(page.quizInfo && page.quizInfo.hasBeenTaken===false){
                    $scope.quizzes = OrganizationV2.getQuizzes({id:page.orgId},
                        //successful response
                        function(){
                            $scope.quiz_select = _.findWhere($scope.quizzes,{id:page.quizInfo.id})
                        }
                    );

                }

                $scope.is_private_post = page.is_private;
                $scope.is_cant_leave = page.is_cant_leave;
                $scope.is_gradeable_post = page.is_gradeable;
                $scope.keep_highest_score= page.keep_highest_score;
                $scope.hide_activity = page.hide_activity;
                $scope.show_archived_posts = page.show_archived_posts;
                $scope.disable_visual_indicators = page.disable_visual_indicators;
                $scope.hide_reply = page.hide_reply;
                $scope.grade.max_points = page.max_points;
                page.layout=page.layout=='HEADER'?'SUB_UNIT':page.layout;
                $scope.page_type = _.findWhere($scope.allowed_pages,{id:page.layout.toLowerCase()});


                // listening activity
                $scope.listen_course = page.listen_course;
                $scope.listen_lesson = page.listen_lesson;
                $scope.listen_numEx = page.listen_numEx;

                // timed review

                $scope.timed_id = page.timed_id;
                $scope.timed_limit = page.timed_limit;
                $scope.timed_pause = page.timed_pause;
                $scope.timeReviewPrompts = page.time_review_data;
                $scope.timed_title = page.timed_title;
                $scope.timed_description = page.timed_description;
                $scope.timed_instruction = page.timed_instruction;

                // nimble knowledge things
                $scope.native_lang = page.native_lang;
                $scope.target_lang = page.target_lang;

                if (page.allowed_takes) {
                    $scope.allowed_takes = parseInt(page.allowed_takes);
                }
                if (page.time_limit) {
                    $scope.time_limit = parseInt(page.time_limit);
                }
                if (page.password) {
                    $scope.password = page.password;
                }
                if (page.meta) {
                    $scope.meta = _.extend({},page.meta);
                    if(page.meta.is_lesson==1){
                        $scope.is_lesson=true;
                    }
                    if(page.meta.page_border_color){
                        $scope.page_border_color = page.meta.page_border_color;
                        $scope.use_color=true;
                    }

                    if(page.meta.limited_post_page==1){
                        $scope.limited_post_page=true;
                        $scope.post_limit = parseInt(page.meta.post_limit);
                    }
                    $scope.exclude_from_gradebook = page.meta.exclude_from_gradebook==1;
                    $scope.append_timed_prompts = page.meta.append_timed_prompts==1;
                }

                if (page.due) {
                    // Split timestamp into [ Y, M, D, h, m, s ]
                    var t = page.due.split(/[- :]/);

                    // Apply each element to the Date function
                    $scope.due_date = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]).toLocaleDateString();
                    $scope.due_time = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
                }
                $scope.no_due_date = page.no_due_date == '1';
                $scope.class_id = page.classid;
                $scope.page_group_id = page.pagegroupid;
                $scope.survey.points = page.survey_points;
                $scope.is_gate = page.gate == 1;
                $scope.no_menu_go_back = page.no_menu_go_back == 1;
                $scope.gate.minimum_score = page.minimum_score==0?'':parseInt(page.minimum_score);
                $scope.minimum_score_for_completion = page.minimum_score_for_completion;
                $scope.require_minimum_score = !isNaN(parseInt(page.minimum_score_for_completion)) && parseInt(page.minimum_score_for_completion)>0;
                $scope.show_created_date = page.show_created_date == 1;
                $scope.show_objectives = page.show_objectives == 1;
                $scope.show_score_per_standard = page.show_score_per_standard;
                $scope.show_mastery = page.show_mastery;
                $scope.mastery_percentage = page.mastery_percentage;
                // convert "1" and "0" to true and false for these attrs.
                var bool_ints = [
                    'allow_video_post',
                    'allow_video_text_post',
                    'allow_text_post',
                    'allow_upload_post',
                    'allow_upload_only_post',
                    'allow_template_post',
                    'is_private_post',
                    'is_cant_leave',
                    'is_gradeable_post',
                    'keep_highest_score',
                    'hide_activity'
                ];

                bool_ints.forEach(function (name) {
                    $scope[name] = $scope[name] == 1;
                })

                $timeout(function () {
                    if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                        CKEDITOR.instances.editor1.setData($scope.page_content);
                    }
                }, 1300);

                if (page.rubricid != 0) {
                    $scope.rubricService.data.stored_id = page.rubricid;
                    $scope.rubricService.data.selected = {id:page.rubricid};
                    $scope.use_rubric = 1;
                }
                if (page.automatically_grade == 1) {
                    $scope.use_rubric = 2;
                }

            });

            function getOrgPreferences(){
                var unitId = CurrentUnitId.getUnitId();
                OrganizationV2.get({id:0,unitId:unitId},function(org){
                    for(var preference in org.preferences) {
                        if (org.preferences.hasOwnProperty(preference)) {
                            if(preference.indexOf('_tooltip')>0){
                                var key = preference.replace('_tooltip','');
                                if(!$scope.orgPreferences[key]){
                                    $scope.orgPreferences[key]={}
                                }
                                $scope.orgPreferences[key].tooltip=org.preferences[preference]
                            }
                            else{
                                if(!$scope.orgPreferences[preference]){
                                    $scope.orgPreferences[preference]={}
                                }
                                $scope.orgPreferences[preference].value=org.preferences[preference];
                            }
                        }
                    }
                });
            }
        }
    ]);

appControllers.directive('dynamic', function ($compile) {
    return {
        restrict: 'A',
        replace: true,
        link: function (scope, ele, attrs) {
            scope.$watch(attrs.dynamic, function (html) {
                ele.html(html);
                $compile(ele.contents())(scope);
            });
        }
    };
});
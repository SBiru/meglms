appControllers.controller('EditPagePreviewController', ['$rootScope', '$scope','$modalInstance','previewurl',
    function ($rootScope, $scope,$modalInstance,previewurl) {
        $scope.previewurl = previewurl;
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
])

appControllers.controller('EditContentController',
    ['$rootScope',
        '$scope',
        '$sce',
        '$timeout',
        '$stateParams',
        'CurrentUnitId',
        'EditPage',
        'EditCourse',
        'Vocab',
        'QuizList',
        'Standard',
        'StandardData',
        'CurrentCourseId',
        'RubricService',
        'Alerts',
        '$modal',
        'OrganizationV2',
        'Class',
        'Gradebook',
        'Categories',
        'Pagebackground',
        '$q',
        'ScormService',
        '$http',
    function($rootScope, $scope, $sce, $timeout,$stateParams, CurrentUnitId, EditPage,EditCourse,Vocab,QuizList,Standard,StandardData,CurrentCourseId,RubricService,Alerts,$modal,OrganizationV2,Class,Gradebook,Categories,Pagebackground,$q,ScormService,$http) {
        var memLeakTestEditTag = function(){};
        getOrgPreferences();
        $scope.__tag = new memLeakTestEditTag()
        $scope.rubricService = RubricService;
        $scope.rubricService.data = _.clone(RubricService.initialData);
        $scope.contentid = $rootScope.$stateParams.contentId;
        $scope.use_rubric='0';
        $scope.loading={};
        $scope.gate={};
        $scope.page_title = '';
        $scope.show_standards=false;
        $scope.page_sub_title = '';
        $scope.page_type = '';

        $scope.scormConfig={};
        $http.get('/api/test/classes').then(function (result) {
            $scope.proficiency_classes = result.data;
        });

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


        $scope.page_content = '';
        $scope.allow_video_post = false;
        $scope.allow_video_text_post = false;
        $scope.allow_text_post = false;
        $scope.allow_upload_post = false;
        $scope.allow_upload_only_post = false;
        $scope.allow_template_post = false;
        $scope.is_private_post = false;
        $scope.is_cant_leave = false;
        $scope.is_gradeable_post = false;
        $scope.keep_highest_score=false;
        $scope.hide_activity = false;
        $scope.show_archived_posts = false;
        $scope.disable_visual_indicators = false;
        $scope.hide_reply = false;
        $scope.quizFilter={};
        $scope.grade = {max_points:0};
        $scope.survey = {points : 0};
        $scope.selectedQuestion={value:null} ;
        $scope.Pagebackground = Pagebackground;
        
        
        $scope.page_group = {
            id: 0,
            name: ''
        };
        $scope.page_group_id = 0;
        $scope.subunits = new Array();
        $scope.allowed_takes = 0;
        $scope.time_limit = 0;
        $scope.password = '';
        $scope.timeReviewPrompts = [];

        // for listening activity
        $scope.listen_course = '';
        $scope.listen_lesson = '';
        $scope.listen_numEx = '';

        // timed review
        $scope.timed_id = '';
        $scope.timed_limit = '';
        $scope.timed_pause = '';
        $scope.timed_title = '';
        $scope.timed_description = '';
        $scope.timed_instruction = '';

        // nimble knowledge things
        $scope.native_lang = '';
        $scope.target_lang = '';
        $scope.buttons = {
            editPage: "Save Changes",
            deletePage: "Delete Page"
        }
        $scope.selectedTemplate = '';
        $scope.categories = null;
        $scope.category = {};

        var cleanUp = [];

        var flashTextForButton = function(variable,flashText,timeout){
            var normalText =$scope.buttons[variable];
            $scope.buttons[variable]=flashText;
            $timeout(function(){
                $scope.buttons[variable]=normalText;
            },timeout);
        }
        var original = {}


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
        $scope.setContent = function(content){
            if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                CKEDITOR.instances.editor1.setData(content);
            }
        }

        EditPage.get({
            pageId: $scope.contentid
        }).$promise.then(function (page) {
                $scope.versionsCount = page.versionsCount
                $scope.vocab = {id:page.moduleid}
                $scope.orgId = page.orgId;
                $scope.page_title = page.pagename;
                $rootScope.pagename = page.pagename;
                $scope.courseId = page.courseId;
                $scope.linkOptions = page.linkOptions;
                $scope.page_sub_title = page.subtitle;
                $scope.canvasTemplate = page.canvasTemplate;
                $scope.category_id = page.category_id;
                $scope.searchquiz = page.searchquiz;
                $scope.objective = page.objective;
                $scope.new_post_text = page.new_post_text;
                $scope.taskType = page.task_type;
                $scope.taskDuration = page.task_duration;
                $scope.scormConfig.scormName = page.scormName;
                $scope.scormConfig.display_description = page.display_description;
                $scope.scormConfig.scormCourseId = page.scormCourseId;
                $scope.scormConfig.scormTitle = page.scormTitle;
                $scope.scormConfig.propsEditorUrl = page.propsEditorUrl != false ? $sce.trustAsResourceUrl(page.propsEditorUrl): page.propsEditorUrl;
                $scope.scormConfig.attributes = page.attributes;


                var regex1 = /<!--cplayoutid:(.*?)-->/g;
                var match = regex1.exec(page.contenthtml);
                if(match) {
                    $scope.useLayouts = true;
                    $scope.cpLayoutId = match[1];
                    var regex2 = /<!--cplayoutblock:(.*?):(.*?)-->/g;
                    var blocks;
                    while(blocks = regex2.exec(page.contenthtml)) {
                        $scope.cpLayoutObj[blocks[1]] = blocks[2];
                    }
                }
                else {
                    $scope.page_content = page.contenthtml;
                }

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

                if($scope.allow_submission) $scope.require_submission=true;

                if (page.time_review_data) {
                    $scope.timeReviewPrompts = page.time_review_data;

                    //console.log($scope.timeReviewPrompts);
                }
                $scope.$broadcast('fetchedReviewPrompts', page);
                $scope.quizInfo = page.quizInfo;

                if(page.quizInfo && page.quizInfo.hasBeenTaken===false){
                     OrganizationV2.getQuizzes({id:page.orgId}
                    ).$promise.then(function(quizzes){
                            $scope.quizzes = quizzes;
                            $scope.quiz_select = _.findWhere($scope.quizzes,{id:page.quizInfo.id})
                        });
                }

                $scope.moduleid = page.moduleid;
                $scope.vocabOptions = page.vocab_config;
                $scope.is_private_post = page.page_is_private;
                $scope.is_cant_leave = page.page_is_cant_leave;
                $scope.is_gradeable_post = page.page_is_gradeable=="1";
                original.is_gradeable_post = page.page_is_gradeable=="1";
                $scope.keep_highest_score = page.keep_highest_score;
                original.keep_highest_score = page.keep_highest_score;
                $scope.hide_activity = page.hide_activity;
                $scope.show_archived_posts = page.show_archived_posts;
                $scope.disable_visual_indicators = page.disable_visual_indicators;
                $scope.hide_reply = page.hide_reply;
                $scope.save_deleted_posts = page.save_deleted_posts;
                $scope.grade.max_points = page.max_points;
                $scope.grade.originalMaxPoints=page.max_points;
                $scope.page_type = page.page_type;
                $scope.external_id = page.external_id;
                $scope.export_id = page.export_id;
                $scope.can_return = page.can_return;
                $scope.show_previous_responses = page.show_previous_responses;
                $scope.category.course = page.category_id;
                $scope.category.org = page.org_category_id;
                $scope.required_pages = page.required_pages;
                $scope.showRequiredPages =  page.required_pages &&  page.required_pages.length;

                // listening activity
                $scope.listen_course = page.listen_course;
                $scope.listen_lesson = page.listen_lesson;
                $scope.listen_numEx = page.listen_numEx;

                // timed review
                $scope.timed_id = page.timed_id;
                $scope.timed_limit = page.timed_limit;
                $scope.timed_prepare = page.timed_prepare;
                $scope.timed_pause = page.timed_pause;
                $scope.timed_title = page.timed_title;
                $scope.timed_description = page.timed_description;
                $scope.timed_instruction = page.timed_instruction;

                // nimble knowledge things
                $scope.native_lang = page.native_lang;
                $scope.target_lang = page.target_lang;
                $scope.selectedQuestion.value = page.question;
                if(page.forumSettings){
                    $scope.forumSettings = page.forumSettings.length === undefined?page.forumSettings:{};
                    $scope.forumSettings.limit_editing_time = $scope.forumSettings.limit_ediding_time || 0;
                }


                if (page.allowed_takes) {
                    $scope.allowed_takes = parseInt(page.allowed_takes);
                }
                if (page.time_limit) {
                    $scope.time_limit = parseInt(page.time_limit);
                }
                if (page.password) {
                    $scope.password = page.password;
                }
                if(page.meta){
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




                if (page.due_date) {
                    // Split timestamp into [ Y, M, D, h, m, s ]
                    var t = page.due_date.split(/[- :]/);

                    // Apply each element to the Date function
                    $scope.due_date = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]).toLocaleDateString();
                    $scope.due_time = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
                }
                $scope.no_due_date = (page.no_due_date == '1');
                $scope.calculate_progress = page.calculate_progress;
                $scope.class_id = page.classid;
                $scope.page_group_id = page.pagegroupid;
                $scope.is_gate = page.gate==1;
                $scope.can_doublecheck_cam_audio = page.double_check_cam_audio==1;
                $scope.no_menu_go_back = page.no_menu_go_back==1;
                $scope.gate.minimum_score = page.minimum_score==0?'':parseInt(page.minimum_score);
                $scope.minimum_score_for_completion = page.minimum_score_for_completion;
                $scope.require_minimum_score = !isNaN(parseInt(page.minimum_score_for_completion)) && parseInt(page.minimum_score_for_completion)>0;
                $scope.survey.points = page.survey_points;
                $scope.show_created_date = page.show_created_date==1;
                $scope.show_objectives = page.show_objectives==1;
                $scope.show_score_per_standard = page.show_score_per_standard;
                $scope.show_mastery = page.show_mastery;
                $scope.journalGradingType=page.journal_grading_type;
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
                    'hide_activity',
                    'show_archived_posts',
                    'disable_visual_indicators',
                    'hide_reply',
                ];

                bool_ints.forEach(function(name) {
                    $scope[name] = $scope[name] == 1;
                })
                $scope.ready = false;
                $timeout(function() {
                    if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                        CKEDITOR.instances.editor1.setData($scope.page_content);
                    }
                    $scope.ready = true;
                }, 1300);


                if(page.rubricid!=0){
                    $scope.rubricService.data.stored_id=page.rubricid;
                    $scope.use_rubric=1;
                }
                if(page.automatically_grade==1){
                    $scope.use_rubric=2;
                    $scope.max_points_main=page.meta.main_max_points;
                    $scope.points_main=page.meta.main_per_post;
                    $scope.max_points_reply=page.meta.reply_max_points;
                    $scope.points_reply=page.meta.reply_per_post;
                }
                EditPage.getsubunits({
                    unit_id: CurrentUnitId.getUnitId(),
                    layout:$scope.page_type.toLowerCase()
                }, function(subunits) {

                    $scope.subunits = subunits.subunits;
                    for (var i = 0; i < $scope.subunits.length; i++) {
                        if ($scope.subunits[i].id == $scope.page_group_id) {
                            $scope.page_group = $scope.subunits[i];
                            break;
                        }
                    }
                    $scope.proficiencyAreas = subunits.proficiencyAreas;
                    $scope.isProficiencyTest = subunits.isProficiencyTest;
                    $scope.gradebookCategories = subunits.gradebookCategories;
                    $scope.hasGlossary = subunits.hasGlossary;
                    $scope.orgOptions = subunits.orgOptions;
                });
            });
        $scope.filterQuizzes=function(item){
            return true;
        }
        cleanUp.push($scope.$watch('meta.backgroundUrl', function(url) {
            if(url){
                $rootScope.backgroundUrl = $rootScope.backgroundUrl || {}
                $rootScope.backgroundUrl[$rootScope.$stateParams.contentId]=$scope.meta.backgroundUrl
            }
        }));
        cleanUp.push($scope.$watch('quizFilter.flag', function(only_course_quizzes) {
            if(only_course_quizzes===undefined) return;
            if(only_course_quizzes)
                $scope.filterQuizzes=function(item){
                    return $scope.courseId==item.course_id;
                }
            else $scope.filterQuizzes=function(item){
                return true;
            }
        }));
        cleanUp.push($scope.$watch('allow_submission', function() {
            if ($scope.allow_submission === 'template'){
                if($scope.use_rubric=='2')
                    $scope.use_rubric='0';
                $scope.show_template_buttons = true;
            }else{
                $scope.show_template_buttons = false;
            }
        }));
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
        cleanUp.push($scope.$watch('selectedQuestion.value',function(){
            if($scope.selectedQuestion.value!=null && $scope.modalSelectQuestion){
                $scope.modalSelectQuestion.dismiss('cancel');
                delete $scope.modalSelectQuestion;
            }
        }))
        $scope.openModalSelectQuestion = function () {

            $scope.modalSelectQuestion   = $modal.open({
                template:'<add-question orgId="orgId" options="{hideRandomTab:true}" ng-model="selectedQuestion.value"></add-question>',
                scope:$scope,
                windowClass:'select-questions'
            })


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
        $scope.openExemptModal = function(){
            $modal.open({
                templateUrl: '/public/views/partials/editor/exemptstudents.html',
                controller: 'ExemptStudentsModalController',
                size: 'lg',
                resolve: {
                    newPage: function(){
                        return false;
                    },
                    currentClass: function(){
                        return Class.query({courseId:$scope.courseId}).$promise;
                    },
                    exempt: function(){
                        return angular.copy($scope.exemptStudents);
                    }
                }
            }).result.then(function (students) {
                    $scope.exemptStudents = students;
                });
        };
        $scope.isGradeable = function(){
            return (['QUIZ','QUIZ_LIST','VOCAB_QUIZ'].indexOf($scope.page_type) > -1) || $scope.is_gradeable_post;
        }
        $scope.canHideContent = function () {
            if(!$scope.page_type) return true;
            return (['sub_unit','journal','external_link','vocab','lesson_listening','listening_practice','reading_practice','class_summary'].indexOf($scope.page_type.toLowerCase()) > -1)
        };
        $scope.canExempt = function() {
            if(!$scope.page_type) {
                return false;
            }
            var exemptable = ['QUIZ','QUIZ_LIST','VOCAB_QUIZ'];
            return (exemptable.indexOf($scope.page_type) > -1) || $scope.is_gradeable_post;
        };

        $scope.getHtmlTemplate = function(template){
            $scope.openTemplatePreview(template);
        }

        $scope.openPreview = function (url) {
            var modalInstance   = $modal.open({
                templateUrl: '/public/views/partials/edit.page.preview.html',
                controller: 'EditPagePreviewController',
                size: 'lg',
                resolve: {
                    previewurl: function () {
                        return url
                    }
                }
            });
        };

        cleanUp.push($scope.$on('rubricSaved',function(){
            $scope.$editPage();
        }));
        $scope.useGradebookCategory = function(){
            return $scope.isGradeable() && $scope.gradebookCategories && $scope.gradebookCategories.length>1;
        };
        function checkGradebookCategoryIfNeeded(){
            var defer = $q.defer();
            if( $scope.useGradebookCategory() && $scope.category_id==null){
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
        $scope.isProficiencyClass = function () {
            var result = _.findWhere($scope.proficiency_classes, {id: CurrentCourseId.data.classId});
            return result!=undefined;
        }
        $scope.editPage = function(button){
            checkGradebookCategoryIfNeeded().then(function(){
                /*
                 If the the teacher is changing the max points, we need to recalculate the due dates
                 */
                if($scope.grade.max_points!= $scope.grade.originalMaxPoints && $scope.navService.navData.orgDetails.calculate_progress){
                    $scope.$editPage(button,{
                        isNeeded:true,
                        when:'now'
                    })
                }
                else{
                    $scope.$editPage(button,{
                        isNeeded:false
                    })
                }
            });
        };
        $scope.editPageThen = function(then) {
            $scope.$editPage('save',undefined,then)
        }
        $scope.$editPage = function(button,recalculateGradebook,then) {
            if($scope.limited_post_page==1&&($scope.post_limit<=0 ||$scope.post_limit==null) )
            {
                alert("limited number of post should not be zero or empty ");
                return;
            }
            if(!$scope.ready && $scope.page_type!="HEADER"){
                return;
            }
            if($scope.page_type=="TIMED_REVIEW"){
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
            if (button){
                $scope.buttonpushed = button;
            }
            else{
                $scope.buttonpushed = 'none';
            }

            if(angular.isDefined($scope.rubricService.data.has_changes) && $scope.rubricService.data.has_changes){
                var resp = confirm("You have unsaved rubric changes. They will be automatically saved. Do you want to proceed?");
                if(!resp){
                    return;
                }
                $scope.$broadcast('saveRubric',{savePage:true});
                return;
            }



            if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                $scope.page_content = CKEDITOR.instances.editor1.getData()
            }
            var page_group_id = 0;

            if (angular.isDefined($scope.page_group) && angular.isDefined($scope.page_group.id) && $scope.page_group.id > 0) {
                page_group_id = $scope.page_group.id;
            }


            var allow_video_post = 0;
            var allow_video_text_post = 0;
            var allow_text_post = 0;
            var allow_upload_post = 0;
            var allow_upload_only_post = 0;
            var allow_template_post = 0;
            var is_private_post = 0;
            var is_cant_leave = 0;
            var is_gradeable_post = 0;
            var keep_highest_score=0;
            var automatically_grade = 0;
            var hide_activity = 0;
            var show_archived_posts = 0;
            var disable_visual_indicators = 0;
            var hide_reply = 0;
            var show_objectives = 0;
            var show_mastery = 0;
            var mastery_percentage = 0;
            var show_score_per_standard=0;
            var show_created_date = 0;
            var survey_points = 0;
            var autograde_options ={};
            var minimum_score='';

            if ($scope.allow_submission == 'video' && $scope.require_submission) {
                allow_video_post = 1;
            }
            if ($scope.allow_submission == 'video_text' && $scope.require_submission) {
                allow_video_text_post = 1;
            }

            if ($scope.allow_submission == 'text' && $scope.require_submission) {
                allow_text_post = 1;
            }

            if ($scope.allow_submission == 'file'&& $scope.require_submission) {
                allow_upload_post = 1;
            }
            if ($scope.allow_submission == 'file_only'&& $scope.require_submission) {
                allow_upload_only_post = 1;
            }

            if ($scope.allow_submission == 'template' && $scope.require_submission) {
                allow_template_post = 1;
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

            if ($scope.keep_highest_score==true) {
                keep_highest_score = 1;
            }

            if ($scope.hide_activity == true) {
                hide_activity = 1;
            }
            if ($scope.disable_visual_indicators == true) {
                disable_visual_indicators = 1;
            }
            if ($scope.hide_reply == true) {
                hide_reply = 1;
            }
            if ($scope.show_archived_posts && $scope.save_deleted_posts) {
                show_archived_posts = 1;
            }
            if($scope.isQuizList()){
                $scope.allowed_takes=1;
            }
            if($scope.allowed_takes<0){
                toastr.warning("Allowed takes must be greater than 0");
                return;
            }
            if($scope.time_limit<0){
                toastr.warning("Time limit must be greater than 0");
                return;
            }

            var quizId = null;
            if ($scope.quiz_select) {
                quizId = parseInt($scope.quiz_select.id);
            }else{
                quizId=$scope.quizInfo?$scope.quizInfo.id:null
            }

            var rubricId = 0;
            if($scope.rubricService.data.selected!=0  && $scope.use_rubric=='1'){
                rubricId = $scope.rubricService.data.id;
            }
            if($scope.use_rubric=='2'){
                automatically_grade=1;
                autograde_options = {
                    main_max_points: $scope.max_points_main || 0,
                    main_per_post: $scope.points_main || 0,
                    reply_max_points: $scope.max_points_reply || 0,
                    reply_per_post: $scope.points_reply || 0
                };
            }
            survey_points = $scope.survey.points;

            var date = new Date($scope.due_date);
            var time = new Date($scope.due_time);
            date.setHours(time.getHours());
            date.setMinutes(time.getMinutes());
            date = date.toLocaleString();

            var meta = _.extend({},$scope.meta);
            for(var i in autograde_options){
                meta[i]=autograde_options[i];
            }
            if($scope.use_color && $scope.page_border_color)
                meta.page_border_color=$scope.page_border_color;
            else
                meta.page_border_color=false;

            meta.is_lesson = $scope.is_lesson?1:0;
            meta.limited_post_page=$scope.limited_post_page?1:0;
            meta.post_limit=$scope.limited_post_page && $scope.post_limit?$scope.post_limit:0;
            meta.exclude_from_gradebook=$scope.exclude_from_gradebook;
            meta.append_timed_prompts=$scope.append_timed_prompts;

            if($scope.is_gate){
                minimum_score=$scope.gate.minimum_score;
            }
            $scope.no_due_date = ($scope.no_due_date)? 1 : 0;

            var question;
            if($scope.selectedQuestion.value){
                question=JSON.stringify(_.map($scope.selectedQuestion.value,function(q){return q.isRandom?q:q.id}))
            }
            var requiredPages;
            if($scope.required_pages){
                requiredPages = JSON.stringify(_.map($scope.required_pages,function(p){
                    return {
                        'id': p.id,
                        'minimumCompletion': p.minimumCompletion
                    }
                }));
            }

            $scope.loading.editPage=1;
            $scope.canvasTemplate =  $scope.canvasTemplate || {}
            if(keep_highest_score!=original.keep_highest_score)
            {
                original.keep_highest_score = keep_highest_score;
                recalculateGradebook.isNeeded = true;
                recalculateGradebook.when= 'now';
            }
            //back up just in case the update happens before cpLayoutObj is updated
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

            if($scope.isUsingLayouts()) promise = $scope.ajaxcall();
            else promise = $q.when(false);

            if ($scope.isScormPageType()) {
                if($scope.scormConfig.scorm_file || $scope.scormConfig.download_url)
                    promise = openScormUpload();
                else
                    promise = $q.when(true);
            }

            promise.then(function() {
                EditPage.update({
                    isScorm: $scope.isScormPageType(),
                    scormName: $scope.scormConfig.scormName,
                    displayDiscription: $scope.scormConfig.display_description ? 1 : 0,
                    scormTitle: $scope.scormConfig.scormTitle,
                    scormCourseId: $scope.scormConfig.scormCourseId,
                    recalculateGradebook: recalculateGradebook,
                    page_id: $scope.contentid,
                    quizId: quizId,
                    question: question,
                    required_pages: requiredPages,
                    page_type: $scope.page_type,
                    external_id: $scope.external_id,
                    export_id: $scope.export_id,
                    page_title: $scope.page_title,
                    gradebook_category_id: $scope.category_id,
                    canvasTemplate: $scope.canvasTemplate,
                    task_type: $scope.taskType,
                    can_return: $scope.can_return,
                    show_previous_responses: $scope.show_previous_responses,
                    category_id: $scope.category.course,
                    vocab_config: $scope.vocabOptions,
                    org_category_id: $scope.category.org,
                    task_duration: $scope.taskDuration,
                    page_sub_title: $scope.page_sub_title,
                    journalGradingType: $scope.journalGradingType,
                    page_group_id: page_group_id,
                    page_content: $scope.page_content,
                    allow_video_post: allow_video_post,
                    allow_video_text_post: allow_video_text_post,
                    allow_text_post: allow_text_post,
                    allow_upload_post: allow_upload_post,
                    allow_upload_only_post: allow_upload_only_post,
                    allow_template_post: allow_template_post,
                    is_private_post: is_private_post,
                    is_cant_leave :is_cant_leave,
                    is_gradeable_post: is_gradeable_post,
                    keep_highest_score: keep_highest_score,
                    automatically_grade: automatically_grade,
                    hide_activity: hide_activity,
                    vocabId:$scope.vocab && $scope.vocab.id?$scope.vocab.id:undefined,
                    show_archived_posts: show_archived_posts,
                    disable_visual_indicators: disable_visual_indicators,
                    hide_reply: hide_reply,
                    show_objectives: show_objectives,
                    show_score_per_standard: show_score_per_standard,
                    show_mastery: show_mastery,
                    mastery_percentage: mastery_percentage,
                    show_created_date: show_created_date,
                    max_points: $scope.grade.max_points,
                    due_date: date, // built a few lines above
                    no_due_date: $scope.no_due_date,
                    class_id: $scope.class_id,
                    allowed_takes: $scope.allowed_takes,
                    password: $scope.meta.auto_start?'':$scope.password,
                    time_limit: $scope.time_limit,
                    minimum_score_for_completion: $scope.minimum_score_for_completion,

                    searchquiz: $scope.searchquiz,
                    // listening activity
                    listen_course: $scope.listen_course,
                    listen_lesson: $scope.listen_lesson,
                    listen_numEx: $scope.listen_numEx,

                    // listening activity
                    timed_id: $scope.timed_id,
                    timed_limit: $scope.timed_limit,
                    timed_pause: $scope.timed_pause,
                    timed_prepare : $scope.timed_prepare,
                    timed_prompts: $scope.timeReviewPrompts,
                    timed_title: $scope.timed_title,
                    timed_description: $scope.timed_description,
                    timed_instruction: $scope.timed_instruction,


                    rubricId: rubricId,
                    objective: $scope.objective,
                    new_post_text: $scope.new_post_text,
                    survey_points: survey_points,
                    gate: $scope.is_gate,
                    double_check_cam_audio: $scope.can_doublecheck_cam_audio,
                    no_menu_go_back: $scope.no_menu_go_back,
                    minimum_score: minimum_score,
                    // nimble knowledge things
                    native_lang: $scope.native_lang,
                    target_lang: $scope.target_lang,
                    meta: meta,
                    template: $scope.canvasTemplate.id,
                    forumSettings:$scope.forumSettings
                }, function (page) {

                    if (page.message.indexOf('successful') >= 0) {
                        $scope.versionsCount = page.versionsCount
                        $scope.loading.editPage = 0;
                        if ($scope.buttonpushed === 'preview') {
                            var addhash = '/#';
                            var url = "../.." + addhash + "/" + $scope.page_type.toLowerCase() + "/" + $scope.contentid + '?no_menu=1';
                            $scope.openPreview(url);
                        }
                        else {
                            $rootScope.$broadcast('NavForceReload');
                        }
                        then && then();
                        //flashTextForButton('editPage',"Updated Page",1000);

                    } else {
                        $scope.loading.editPage = 2;
                        Alerts.danger({
                            title: 'Changes could not be saved',
                            content: page.message,
                            textOk: 'Ok'
                        }, function () {
                        });

                    }
                }, function (error) {
                    $scope.loading.editPage = 2;
                    Alerts.danger({
                        title: 'Changes could not be saved',
                        content: error.statusText,
                        textOk: 'Ok'
                    }, function () {
                    });

                });
            });

        }
        $scope.previewQuizList = function(){
            QuizList.list({
                search:$scope.searchquiz
            },function(response){
                $scope.previewQuizzes = response.quizzes;
            });
        }
        $scope.incrementMaxpoints = function(points) {
            if(angular.isDefined(points)){
                $scope[points]=$scope[points]||0;
                $scope[points]++;
            }
            else
                $scope.grade.max_points++;
        };

        $scope.decrementMaxpoints = function(points) {
            if(angular.isDefined(points)){
                $scope[points]=$scope[points]||0;
                $scope[points]--;
            }
            else
                $scope.grade.max_points--;
        };
        function handleAutoGradePoints(){
            if($scope.use_rubric!=2)
                return;
            $scope.max_points_main=$scope.max_points_main||0;
            $scope.max_points_reply=$scope.max_points_reply||0;
            $scope.grade.max_points = parseInt($scope.max_points_reply)+parseInt($scope.max_points_main);
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
        cleanUp.push($scope.$watch($scope.isGradeable,function(isGradeable){
            if(!isGradeable || $scope.categories) return;
            Categories.class.get(
                {classId:$scope.class_id}
            ).$promise.then(function(c){
                    if(c.org.length){
                        c.org.unshift({id:null,name:"None"})
                    }
                    if(c.course.length){
                        c.course.unshift({id:null,name:"None"})
                    }
                    $scope.categories = c

                })

        }));
        cleanUp.push($scope.$watch('max_points_reply',handleAutoGradePoints));
        cleanUp.push($scope.$watch('max_points_main',handleAutoGradePoints));
        cleanUp.push($scope.$watch('use_rubric',handleMaxPointsInput));
        $scope.deletePage = function(pageId,recalculate) {
            var callback = function(page) {
                if (page.message == 'successful') {
                    $scope.loading.deletePage=0;
                    $rootScope.$broadcast('NavForceReload');

                } else if(page.message=='has_children'){
                    Alerts.warning({
                        title:'Delete Group',
                        content:'Are you sure you want to delete everything in this group',
                        textOk:'Ok',
                        textCancel:'Cancel'
                    },function(){
                        EditPage.del({
                            page_id: $scope.contentid,
                            confirm_delete:true,
                            recalculate:recalculate
                        }, callback);
                    });
                }
                else{
                    $scope.loading.deletePage=2;
                    Alerts.danger({
                        title:'Page could not be deleted',
                        content:page.message,
                        textOk:'Ok'
                    },function(){});
                }
            };
            if(!recalculate){
                Alerts.warning({
                    title:'Delete Page',
                    content:'Are You Sure You Want To Delete This Page',
                    textOk:'Ok',
                    textCancel:'Cancel'
                },function(){
                    if($scope.navService.navData.orgDetails.calculate_progress &&
                        (original.is_gradeable_post || $scope.page_type.toLowerCase().indexOf('quiz')>=0)
                    ){
                        Gradebook.openRecalculationWarning(
                            function(){
                                $scope.deletePage(pageId,'now')
                            },
                            function(){
                                $scope.deletePage(pageId,'later')
                            }
                        )
                    }
                    else{
                        $scope.loading.deletePage=1;
                        EditPage.del({
                            page_id: $scope.contentid,
                            recalculate:recalculate
                        }, callback);
                    }
                });
            }else{
                $scope.loading.deletePage=1;
                EditPage.del({
                    page_id: $scope.contentid,
                    recalculate:recalculate
                }, callback);
            }

        };

        $scope.hasAssignment = function() {
            if ($scope.allow_video_post == true || $scope.allow_video_text_post == true || $scope.allow_text_post == true || $scope.allow_upload_post|| $scope.allow_upload_only_post == true || $scope.allow_template_post == true) {
                return true;
            }

            return false;
        }
        $scope.copyNavData = function(){
            $scope.navData = angular.copy($scope.navService.navData);
        }
        $scope.isContent = function() {
            return ($scope.page_type.toLowerCase() == 'content');
        }

        $scope.isUsingLayouts = function () {
            return $scope.useLayouts;
        };

        $scope.setUseLayouts = function(bool) {
            $scope.useLayouts = bool;
        };

        $scope.setcpLayoutId = function (cpLayoutId) {
            $scope.cpLayoutId = cpLayoutId;
        }
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

        $scope.isQuiz = function() {
            return ($scope.page_type.toLowerCase() == 'quiz');
        }
        $scope.isTakePicture = function() {
            return ($scope.page_type.toLowerCase() == 'picture');
        }
        $scope.isUserForm = function() {
            return ($scope.page_type.toLowerCase() == 'user_info_form');
        }
        $scope.isGlossary = function() {
            return ($scope.page_type.toLowerCase() == 'glossary');
        }
        $scope.isSurvey = function() {
            return ($scope.page_type.toLowerCase() == 'survey')|| ($scope.quizInfo && $scope.quizInfo.is_survey);
        }
        $scope.isVocab = function() {
            return ($scope.page_type.toLowerCase() == 'vocab');
        }
        $scope.isVocabQuiz = function() {
            return ($scope.page_type.toLowerCase() == 'vocab_quiz');
        }
        $scope.isQuizList = function() {
            return ($scope.page_type.toLowerCase() == 'quiz_list');
        }
        $scope.isJournal = function() {
            return ($scope.page_type.toLowerCase() == 'journal');
        }
        $scope.isNimble = function() {
            var nimbles = ['lesson_listening', 'listening_practice', 'reading_practice']
            return nimbles.indexOf($scope.page_type.toLowerCase()) !== -1;
        }

        $scope.isLessonListening = function() {
            return $scope.page_type.toLowerCase() == 'lesson_listening';
        }

        $scope.isTimedReview = function() {
            return $scope.page_type.toLowerCase() == 'timed_review';
        }
        $scope.isForum = function() {
            return $scope.page_type.toLowerCase() == 'forum';
        }

        $scope.isContent = function() {
            if ($scope.page_type.toLowerCase() == 'content') {
                return true;
            }

            return false;
        }

        $scope.isScormPageType = function() {
            return $scope.page_type.toLowerCase() == 'scorm';
        }

        $scope.isShowSubmissionTypeCheckboxes = function() {
            return ($scope.page_type.toLowerCase() !== 'quiz')&&
                ($scope.page_type.toLowerCase() !== 'vocab') &&
                ($scope.page_type.toLowerCase() !== 'survey') &&
                ($scope.page_type.toLowerCase() !== 'vocab_quiz') &&
                ($scope.page_type.toLowerCase() !== 'journal') &&
                ($scope.page_type.toLowerCase() !== 'external_link') &&
                ($scope.page_type.toLowerCase() !== 'forum')
                ;
        }
        $scope.isShowPageGroupingSelector = function() {
            return ($scope.page_type) &&
                ($scope.page_type.id !== 'sub_unit');
        }
        $scope.getQuizInfo = function(){
            if(!$scope.quizInfo)
                return;
            return $scope.quizInfo.title + ' (' + $scope.quizInfo.questions + ') - id:'+ $scope.quizInfo.id ;
        }
        $scope.$on('$destroy',function(){
            angular.forEach(cleanUp,function(fn){
                fn();
            })
            cleanUp = [];
        })


    }
]);
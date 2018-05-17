appControllers.controller('ContentController', ['$rootScope', '$scope', '$sce', '$timeout', 'Content', 'History', 'Currentpageid', 'Page','CurrentCourseId','$location','$modal','$window','PostsLimitingService','CurrentUnitId','noMenuFooterOptions','$compile',
    function ($rootScope, $scope, $sce, $timeout, Content, History, Currentpageid, Page,CurrentCourseId,$location,$modal,$window,PostsLimitingService, CurrentUnitId,noMenuFooterOptions,$compile) {




        $scope.checkPassword = checkPassword;
        $scope.contentid = $rootScope.$stateParams.contentId;
        $scope.isGlossary = $scope.$state.current.name==='glossary';

        $scope.$root.resizeTriggers={
            content:{}
        };
        $scope.CC = {}
        $scope.trustAsResourceUrl = $sce.trustAsResourceUrl;
        $scope.$root.resizeFunctions={
            content:function(windowHeight,element,doResize){
                if(doResize===false){
                    element.css('max-height','auto');
                }else{
                    var top = element[0].getBoundingClientRect().top
                    element.css('max-height',( windowHeight-($window.scrollY+top))*2/3 - 10);
                    element.css('display','block');
                    element.css('overflow','auto');
                }

            }
        };
        Content.get({
            contentId: $rootScope.$stateParams.contentId
        }, function (content) {
            if(content.is_scorm){
                $scope.isScorm = true;
                $scope.scorm_course_id = content.scorm_course_id;
                $scope.scorm_name = content.scorm_name;
                $scope.display_description = content.display_description == 1 ? true : false;
                $scope.scorm_title = content.scorm_title;
                $scope.page_id = content.id;
                $scope.isStudent = content.isStudent;
                $scope.userMail = content.userMail;
                $scope.userFirstName = content.userFirstName;
                $scope.userLastName = content.userLastName;
                $scope.userId = content.userId;
                $scope.score = content.score;
            }
            $rootScope.layout = content.layout;
            $scope.orgId = content.orgId;
            $scope.$broadcast('contentData',content);
            Currentpageid.RecordingPageAccess($scope.contentid);
            //for linked content pages
            if(CurrentUnitId.getFromCookie()!=content.unitid){
                $scope.$emit("changeToUnit",content.unitid);
            }
            CurrentUnitId.setUnitId(content.unitid);



            var isEnglishSelected = document.getElementById('english-language-selector').checked;

            $scope.$on('pageContentEmpty', function(event, arg) {
                delete  $scope.contenthtml;
                $scope.pagename = '';
                $rootScope.pagename = $scope.pagename;
                $rootScope.$broadcast('current_unit_titleEmpty', []);
                $rootScope.$broadcast('ProgressBarControllerEmpty', []);
                $location.url($location.path().replace(/\/\d+$/,''));

            });
            noMenuFooterOptions.restartValues();
            noMenuFooterOptions.nextText = content.next_text;
            noMenuFooterOptions.isIdVerification = content.isIdVerification;
            noMenuFooterOptions.nextClassName = content.nextClassName;
            noMenuFooterOptions.newPostClassName = content.meta.new_post_color;

            delete $scope.$root.custom_new_post_text;
            if(content.new_post_text){
                $scope.$root.custom_new_post_text = content.new_post_text;

            }
            //If we have mathsJax
            if ((typeof content.contenthtml !== 'undefined') && (content.contenthtml.match(/class="math-tex"/)) && (content.contenthtml.match(/\\\(/))) {
                $scope.contenthtml = $sce.trustAsHtml(content.contenthtml);
                $scope.mathjaxcontent = content.contenthtml;
                var test =  content.contenthtml.replace(/\r\n|\n|\r/g,''),tmp = {};
                $scope.contentPlusMathjac = [];
                test = test.replace(/&nbsp;/,' ');
                while (test.match(/<span class="math-tex">.*?\)<\/span>/)) {
                    var a = test.match(/(.*?)<span class="math-tex">(.*?\))<\/span>/);
                    if (typeof a[2] !== 'undefined') {
                        a[2] = a[2].replace(/\\\(|\\\)/g,'');
                        tmp.html = a[1];
                        tmp.maths = a[2];
                        $scope.contentPlusMathjac .push(tmp);
                        tmp = {};
                    }
                    test = test.replace(/.*?<span class="math-tex">.*?\)<\/span>/, '');
                }
                tmp = {}
                //tmp.html = $sce.trustAsHtml(test);
                tmp.html = test;
                $scope.contentPlusMathjac .push(tmp);
            } else {
                if (typeof $scope.contentPlusMathjac !== 'undefined'){
                    delete $scope.contentPlusMathjac;
                }
                content.contenthtml = content.contenthtml || "";
                $scope.contenthtml = $sce.trustAsHtml(compileIfNeeded(content.contenthtml));
            }
            $scope.selectedTemplate = content.template;


            $scope.pagename = content.pagename;
            $rootScope.pagename = (isEnglishSelected) ? content.pagename : content.subtitle;
            $scope.is_mobile = ON_MOBILE;
            $scope.allow_video_post = content.allow_video_post;
            $scope.allow_video_text_post = content.allow_video_text_post;
            $scope.allow_text_post = content.allow_text_post;
            $scope.allow_upload_post = content.allow_upload_post;
            $scope.allow_upload_only_post = content.allow_upload_only_post;
            $scope.allow_template_post = content.allow_template_post;
            $scope.submit_file_automatically = content.submit_file_automatically;
            $scope.page_is_private = content.page_is_private;
            $scope.page_is_gradeable = content.page_is_gradeable;
            $rootScope.show_archived_posts = content.show_archived_posts;
            $scope.need_password = content.need_password;
            $rootScope.showResubmit = content.showResubmit;
            $rootScope.hideReplies = content.hide_reply;
            $rootScope.backgroundUrl = $rootScope.backgroundUrl || {}
            content.meta = content.meta || {};
            $rootScope.backgroundUrl[$rootScope.$stateParams.contentId]=content.meta.backgroundUrl
            $scope.post_options = {new_post_color:content.meta.new_post_color || 'btn-primary btn-post'};
            $rootScope.beforeLeavePage.setQuestion(content.question&&content.question.length?content.question[0]:null)
            intializeVideos();
        });
        $scope.allowVideoTextPost = function(){
            return $scope.allow_video_text_post == 1;
        }
        $scope.showVideo = function(message){
            return $scope.allow_video_post ==1 || $scope.allowVideoTextPost() || message.is_teacher
        }

        $scope.showArchiveButton = function(){
            return $rootScope.user &&
                $rootScope.archiveMessages && $rootScope.archiveMessages.length &&
                ($rootScope.user.is_super_admin ||
                $rootScope.user.is_organization_admin ||
                $rootScope.user.is_teacher) &&
                $rootScope.show_archived_posts;
        }
        function compileIfNeeded(html){
            if(html.indexOf('adjustplaysize')>0)
                return  html
            return html
        }
        function intializeVideos() {
            $timeout(function () {
                angular.forEach(angular.element('video'), function (video) {
                    checkHeightAndWidth(video);
                    var setupStr = $(video).attr('data-setup') || '{}'
                    var setup;
                    try{
                        setup = JSON.parse(setupStr);
                    }catch(e){
                        setup = {}
                    }
                    videojs(video, _.extend({
                        flash: {
                            swf: '/public/lib/video-js.swf'
                        },
                        preload: "none"
                    },setup));
                });
            }, 100)
        }
        function checkHeightAndWidth(video){
            if(!angular.element(video).attr('width'))
                angular.element(video).attr('width','640px');
            if(!angular.element(video).attr('height')){
                angular.element(video).attr('height','320px');
                angular.element(video).css('height','320px');
            }

        }

        function checkPassword() {
            if ($scope.need_password) {
                Page.get({
                    id: $scope.contentid,
                    password: $scope.CC.user_password
                }, function (res) {
                    if (!res.error) {
                        $scope.need_password = false;
                    }
                })
            }
        }
    }
]).service('PostsLimitingService', function(){
    var numberOfPostSubmitted;
    this.setnumberOfPostSubmitted = function(data) {
        numberOfPostSubmitted = data;
    }
    this.getnumberOfPostSubmitted = function()
    {
        return numberOfPostSubmitted;
    }
});;
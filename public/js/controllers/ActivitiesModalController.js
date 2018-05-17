'use strict';

angular.module('app')
.controller('ActivitiesModalController',['$scope','$modalInstance','courseName','courseData','$resource','HelperService','ShowDatesGrades','$rootScope','CurrentUnitId','CurrentCourseId','current_unit_id','courseInfo','$timeout','isCourseView',
    function($scope, $modalInstance,courseName,courseData,$resource,HelperService,ShowDatesGrades,$rootScope,CurrentUnitId,CurrentCourseId,current_unit_id,courseInfo,$timeout,isCourseView){

        $scope.courseName = courseName;
        $scope.courseData = courseData;
        $scope.current_unit_id = current_unit_id;
        $scope.taskStatusTextWrapperClass = "sidebar-points-right";
        $scope.courseInfo = courseInfo;
        $scope.isCourseView = isCourseView;

        $scope.cancel=function(){
            $modalInstance.dismiss('cancel');
        };

        $scope.isExternalLinkPage = function (page) {
            return page.layout == 'external_link';
        };

        $scope.showEditButton = function(){
            var me = $scope.$root.user;
            if(!me || !$scope.courseData) return false;
            return $scope.courseData.isEditTeacher || me.is_super_admin || me.is_organization_admin;
        }

        $scope.hideBox = function(nav){
            return nav.disableVisualIndicators;
        }

        $scope.showCheckMark = function(nav,pages){
            return (nav.isGraded &&  !nav.minimumNotAchieved && !nav.waitingForGrade && !nav.mastery)|| (nav.isExempt) || (!$scope.submittingIsNeeded(nav) && nav.isViewed) || $scope.isChildrenChecked(nav,pages) || (nav.isSubmitted && !$scope.isGradeable(nav));
        }

        $scope.showGoldenStar = function(nav){
            return nav.mastery && !nav.isExempt;
        }

        $scope.showWaitingGrade = function(nav){
            return ((nav.isSubmitted && !nav.isGraded) || nav.waitingForGrade) && !nav.isExempt && $scope.isGradeable(nav)
        }

        $scope.isGradeable = function(page){
            return page.is_gradeable==1  || page.layout.indexOf('quiz')>=0;
        }

        $scope.isChildrenChecked= function (nav,pages){
            // var pages = pages || Nav.getPages();
            var children = _.filter(pages,function(page){
                return page.header_id==nav.id;
            });
            if(children.length==0) return false;
            for(var i in children){
                if(!(children[i].isSubmitted || children[i].isGraded || (!$scope.submittingIsNeeded(children[i]) && children[i].isViewed)))
                    return false;
            }
            return true;
        }

        $scope.submittingIsNeeded = function(page){

            return page.allow_video_post == '1' ||
                page.allow_text_post == '1' ||
                page.allow_upload_only_post == '1' ||
                page.allow_upload_post == '1' ||
                page.is_gradeable_post == '1' ||
                page.is_gradeable_post == '1'  ||
                page.layout.indexOf('quiz')>=0 ||
                page.layout.indexOf('survey')>=0

        }

        $scope.isEnglishSelected = function() {
            if(!document.getElementById('english-language-selector')) {
                return false;
            }
            var isEnglishSelected = document.getElementById('english-language-selector').checked;
            if(isEnglishSelected == true){
                $rootScope.$broadcast('ChangeToLTRCourse');
            } else {
                if($rootScope.currentCourse.rtl_support == 1){
                    $rootScope.$broadcast('ChangeToRTLCourse');
                }
            }
            return isEnglishSelected;
        }

        $scope.isPageAllowed = function (index,page){

            var allowed = {
                allowed:true,
                reason:null
            };

            if(!page.permission.allowed || !$scope.courseData.isStudent){
                return page.permission;
            }

            if(!angular.isDefined($scope.gatePage) || !angular.isDefined($scope.gatePage.page)) return allowed;
            var cur_unit = _.findWhere($scope.courseData.units,{id:CurrentUnitId.getUnitId()});

            var gateNotComplete = {
                allowed:false,
                reason:'Must complete activity ' + $scope.gatePage.page.label + ', unit ' + $scope.gatePage.unit.name
            };

            if(!angular.isDefined($scope.gatePage.page))
                return allowed;
            if(parseInt(cur_unit.name)<parseInt($scope.gatePage.unit.name))
                return allowed;
            if(parseInt(cur_unit.name)>parseInt($scope.gatePage.unit.name))
                return gateNotComplete;
            return index<=$scope.gatePage.page.index?allowed:gateNotComplete;

        };

        $scope.getHref = function(nav,index){
            // index = index || currentPageIndex()
            var permission = $scope.isPageAllowed(index,nav),
            prefix = $scope.isCourseView?'':'/';
            var href = permission.allowed?prefix+'#/'+nav.layout+'/'+nav.id:prefix+'#/not_allowed?reason='+permission.reason;
            if(nav.layout === 'forum')
                href += '/topics/' + nav.id;
            return href;
        }

        $scope.changeState = function (nav) {
            if(angular.isDefined(nav.isCollapsed)){
                nav.isCollapsed = !nav.isCollapsed;
            }else {
                nav.isCollapsed = true;
            }
        };

        $scope.showGrade = function(nav){
            return (!nav.waitingForGrade && !nav.isExempt && ((nav.isSubmitted && nav.isGraded) || (!nav.overrideDeleted && nav.scoreOverride !== null)) && parseInt(nav.showGrades) === 1) || nav.layout == "scorm";
        };

        $scope.openFeedback = function (nav_){
            if(!nav_.hasFeedback) return;
            var nav;
            if(typeof nav_ !== "object")
                nav={id:nav_};
            else
                nav = angular.copy(nav_);

            var templateUrl,
                controller,
                windowClass;
            if(nav.layout=='quiz'){
                templateUrl = '/public/views/partials/notificationgradequiz.html'
                controller = 'NotificationQuizController'
                windowClass='feedback-quiz-modal'
                nav.page_id = nav.id;
            }
            else if(nav.layout=='forum'){
                templateUrl = '/public/views/partials/notificationgradeforum.html'
                controller = 'NotificationForumController'
                windowClass='feedback-quiz-modal'
                nav.page_id = nav.id;
            }
            else{
                nav.id = nav.postFeedbackId;
                templateUrl = '/public/views/partials/notificationgradepost.html?cachesmash=5'
                controller = 'NotificationGradePostMessagesController'
                windowClass='feedback-modal'

            }


            var modalInstance = $modal.open({
                templateUrl: templateUrl,
                windowClass: windowClass,
                controller: controller,
                resolve: {
                    notification: function () {
                        return nav;
                    }
                }
            });
        };

        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }

        function getLetterGrade(percentage){
            return ShowDatesGrades.getLetterGrade($scope.courseInfo.rubric,percentage);
        }

        $scope.showDate = function(nav){
            return nav.showDate=='1' && !nav.isExempt && !nav.isSubmitted && !nav.isGraded && (!nav.no_due_date || $scope.courseData.isDueDateSet!==false) && ($scope.isGradeable(nav))
        }

        $scope.formatDate = function(page) {
            if(!page.class_due_date) { return; }
            var dueDate = page.class_due_date,
                format = 'MMM-DD YY';
            if($scope.courseData.stylesAndColors && $scope.courseData.stylesAndColors.due_date_format){
                format =  $scope.courseData.stylesAndColors.due_date_format;
            }
            return moment(dueDate).format(format);
        };

        $scope.getGradeOverall = function(page) {
            if(page.minimum_score_for_completion){
                return page.minimumNotAchieved?'low':'high';
            }
            var score = (page.scoreOverride !== null)? parseInt(page.scoreOverride) : page.quiz_score;
            if (score == null || score == 'undefined') {
                score = page.grade;
            }
            var total = page.max_quiz_points;
            if (total == null || total == 'undefined') {
                total = page.total_points;
            }
            var overall = 'high';
            if(score <= total * 0.75) {
                overall = 'mid';
            }
            if(score <= total * 0.5) {
                overall = 'low';
            }
            if(page.hasFeedback)
                overall+= " has-feedback"
            return overall;
        };

        $scope.formatGrade = function(page) {
            var score = (page.scoreOverride !== null)? parseInt(page.scoreOverride) : page.quiz_score;
            if (score == null || score == 'undefined') {
                score = page.grade;
            }
            var total
            if(page.is_survey && !page.max_quiz_points)
                return '';
            else{
                total = page.max_quiz_points || page.total_points;
            }

            var points = {
                score:score,
                max:total
            };

            var class_ = $scope.courseInfo;
            if(points && points.max && points.max>0 && points.score!=null) {
                var grade ="";
                points.score=points.score==""?0:points.score;
                if (class_.show_grades_as_score == 1) {
                    grade += points.score + "/" + points.max;
                }
                if (class_.show_grades_as_percentage == 1) {
                    grade += "(" + getScorePerc(points) + "%)"
                }
                if (class_.show_grades_as_letter == 1) {
                    grade += " " + getLetterGrade(getScorePerc(points));
                }

                return grade == "" ? points.score + "/" + points.max + "(" + getScorePerc(points) + "%)" : grade
            }
            else if(page.layout == 'scorm'){
                points.score = page.score;
                points.max = page.max_score;
                return page.score != null && page.max_score != null ? page.score + "/" + page.max_score + "(" + getScorePerc(points) + "%)" : "";
            }
            return '';
        }

        $scope.isCollapsed = function (nav,pages) {
            if(nav.header_id == "0"){
                return false;
            }else {
                var header = _.find(pages,function(p){
                    return p.id == nav.header_id;
                });
                return header.isCollapsed;
            }
        };

        $scope.goto = function (unit,navId,$event,$index) {
            if($scope.isCourseView){
                $scope.$emit('goToCourseView',{unit:unit,navId:navId,event:$event,index:$index});
            }else {
                CurrentCourseId.setCourseId($scope.courseInfo.courseid);
                CurrentUnitId.setUnitId(unit.id);
            }
            $scope.cancel();
        };

        $scope.canHide = function (nav,pages) {
            return nav.hide_activity == 1 || nav.hide_group == 1 || $scope.isCollapsed(nav,pages);
        };

        $scope.getUnitBodyStyle = function (unitId) {
            if($scope.current_unit_id == unitId){
                return {'box-shadow': '0 1px 4px 0 rgb(34, 82, 191)'}
            }else {
                return {'box-shadow': '0 1px 4px 0 rgba(10,10,10,0.2)'}
            }
        };

        $scope.getUnitTitleStyle = function (unitId) {
            if($scope.current_unit_id == unitId){
                return {'color': 'white','background-color':'#2252c0'}
            }else {
                return {'color': '#2252c0','background-color':'#d9d9d9'}
            }
        };

        $scope.isItemHeader = function(item) {
            return item.layout === 'header';
        }

        function isActiveId($rootScope, id) {
            return (id === $rootScope.$stateParams.vocabId ||
            id === $rootScope.$stateParams.quizId ||
            id === $rootScope.$stateParams.contentId ||
            id === $rootScope.$stateParams.externalLinkId);
        }

        $scope.isActive = function(id) {
            return isActiveId($rootScope, id) ? 'active' : false;
        }

        $scope.getActivityStyle = function (nav) {
            return {'padding-left':nav.header_id>0?'70px':'40px','list-style-type':$scope.isItemHeader(nav)?'none':'disc','background-color':$scope.isActive(nav.id) == 'active'?'rgba(34, 82, 192,0.2)':''}
        };

        $scope.printCsv = function(){
            $resource('/api/export/table-of-contents').save({courseName:$scope.courseName, courseData:$scope.courseData},function(res){
                HelperService.buildFileFromData(res.content,'table-of-contents_'  +$scope.courseName+ '.csv');
            })
        }

        $scope.printPdf = function () {
            var ele = $("#activities-modal-body")[0], clonedEle = ele.cloneNode(true);
            clonedEle.style.padding = "0px";
            clonedEle.style.paddingBottom = "0px";
            clonedEle.style.paddingLeft = "0px";
            clonedEle.style.paddingRight = "0px";
            clonedEle.style.paddingTop = "0px";
            clonedEle.children[0].style.display = '';
            angular.forEach(clonedEle.children,function (child) {
                child.style.boxShadow = "";
            });
            html2pdf(clonedEle,{
                margin: [0.3,0.25,0,0.25],
                image: { type: 'jpeg', quality: 1 },
                filename: $scope.courseName+'.pdf',
                html2canvas:  { dpi: 192, letterRendering: true },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            });
        }

        $scope.getGatePage = function(){
            var  gatePage = {}
            if($scope.courseData == null) return;
            gatePage.unit = _.find($scope.courseData.units,function(unit){
                var index;
                gatePage.page = _.find(unit.pages,function(page,idx){
                    index = idx;
                    if(page.gate==1 && page.minimum_score>0){

                        var score;
                        if(page.scoreOverride){
                            score = page.scoreOverride
                        }
                        else{
                            if(page.layout=='quiz'){
                                score = page.quizFinished?page.quiz_score:0;
                            }else{
                                score = page.grade || 0;
                            }

                        }

                        return page.isExempt?false:parseInt(score)<parseInt(page.minimum_score);
                    }
                    return page.isExempt?false:page.gate=='1' &&
                        !(
                            ($scope.submittingIsNeeded(page) && page.isSubmitted) ||
                            (page.is_gradeable && page.isGraded) ||
                            (!($scope.submittingIsNeeded(page) && page.is_gradeable) && page.isViewed)

                        );
                });
                if(angular.isDefined(gatePage.page))
                    gatePage.page.index = index;
                return angular.isDefined(gatePage.page);
            });
            $scope.gatePage = gatePage;
        };

        $scope.getGatePage();

        function addPageBreakForPdfPrint(eleId,eleCount) {
            if(!(eleCount%32 == 0)) return;
            $('#'+eleId).addClass('html2pdf__page-break');
            $scope.eleCount=0;
        }

        $timeout(function () {
            $scope.eleCount=1; // value is 1 because the first page of the pdf fill will have course title
            angular.forEach($scope.courseData.units,function (unit,mainIndex) {
                $scope.eleCount++;
                addPageBreakForPdfPrint("titlePageBreakEle"+mainIndex,$scope.eleCount);
                angular.forEach(unit.pages,function (page,index) {
                    if(!$scope.canHide(page,unit.pages)){
                        $scope.eleCount++;
                        addPageBreakForPdfPrint("activityPageBreakEle"+mainIndex+"_"+index,$scope.eleCount);
                    }
                });
            });
        });

    }
]);

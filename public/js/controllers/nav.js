'use strict';
function getJsonFromUrl() {
    var query = location.href.split('?');
    if(!query.length > 1)
        return;
    query = query[1];
    var result = {};
    if(!query) return result;
    query.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}
function isActiveId($rootScope, id) {
    return (id === $rootScope.$stateParams.vocabId ||
    id === $rootScope.$stateParams.quizId ||
    id === $rootScope.$stateParams.contentId ||
    id === $rootScope.$stateParams.externalLinkId);
}
function getActiveNavId($rootScope) {
    return ($rootScope.$stateParams.vocabId ||
    $rootScope.$stateParams.quizId ||
    $rootScope.$stateParams.contentId ||
    $rootScope.$stateParams.externalLinkId);
}


function getById(items, id) {
    for (var i = 0; i < items.lenght; i++) {
        if (items[i].id === id) return items[i]
    }
}

function isSkippableMenuItem(nav) {
    if (location.pathname === '/editor/') return false
    if (!nav) return false
    var skipNav = ['external_link', 'header'];
    if (skipNav.indexOf(nav.layout) !== -1 || nav.hide_activity == 1) return true
    return false
}

function shouldCollapseSidebar() {
    return window.innerWidth < 1024;
}

/*
 Golabs 23.06/2015
 Checking to see if we running in a iframe
 */
function checkiniframe(){
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}


appControllers.controller('NavController', [
    '$rootScope',
    '$scope',
    '$timeout',
    '$location',
    '$modal',
    'Menu',
    'Nav',
    'CurrentUnitId',
    'CurrentCourseId',
    'EditPage',
    'CurrentHeaderId',
    'Cookiecutter',
    'Currentunitkey',
    'ShowDatesGrades',
    'ClassMeta',
    'UserInformation',
    'GraderNav',
    'Alerts',
    'Class',
    'Announcements',
    'Gradebook',
    'StudentVideoRecorder',
    'CurrentSuperUnitId',
    function($rootScope, $scope, $timeout, $location,$modal, Menu, Nav, CurrentUnitId, CurrentCourseId, EditPage, CurrentHeaderId, Cookiecutter, Currentunitkey, ShowDatesGrades,ClassMeta,UserInformation,GraderNav,Alerts,Class,Announcements,Gradebook,StudentVideoRecorder,CurrentSuperUnitId) {

        $scope.navService = Nav;
        $scope.studentVideoRecorder = StudentVideoRecorder;
        $scope.courseInfo = CurrentCourseId;
        $scope.userInfo = UserInformation;
        $scope.loadAnnouncements = loadAnnouncements;
        $scope.loading={};
        // Default to showing due dates and assignment points on the right
        $scope.taskStatusTextWrapperClass = "sidebar-points-right";
        // Provide function calls to switch the location of the sidebar points text
        $scope.$on('MoveTaskStatusToLeft', function(){
            $scope.taskStatusTextWrapperClass = "sidebar-points-left";
        });
        $scope.$on('MoveTaskStatusToRight', function(){
            $scope.taskStatusTextWrapperClass = "sidebar-points-right";
        });
        $rootScope.$on('$locationChangeSuccess',function(newValue){
            $scope.activePage = {id:getActiveNav().id}
        })

        $scope.$watch('navService.changed',function(newValue){
            $scope.navData = Nav.navData;
            $scope.getGatePage();
        });


        $scope.noMenu = function(){
            if(!$scope.navService.classMeta)
                return false;
            return ($scope.navService.classMeta.no_menu &&
                $scope.navService.classMeta.no_menu.meta_value=='1') || false;
        }
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
        $scope.getGatePage = function(){
            var  gatePage = {}
            if($scope.navData == null) return;
            gatePage.unit = _.find($scope.navData.units,function(unit){
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

        function loadAnnouncements(force){
            delete $scope.$root.class_announcements;
            delete $scope.$root.announcements;
            $scope.$root.announcements = Announcements.forClass(
                {
                    orgid:0,
                    classid:$scope.courseInfo.data.class_id,
                },function(result){
                    if(result.length){
                        var showModal = false;
                        for(var i = 0;i<result.length;i++){
                            if(!result[i].isViewed){
                                showModal= true;
                                break;
                            }
                        }
                        if(showModal || force)
                            $modal.open({
                                templateUrl: '/public/views/partials/student/class_announcements.html',
                                controller:'ClassAnnouncementsModalController',
                                size:'lg',
                                backdrop: 'static',
                                windowClass:'class-announcements-modal'
                            })
                    }
                }
            )
        }
        function getActiveNav(){
            return _.find(Nav.getPages(),function(p){
                return p.id == Menu.current_id;
            })
        }
        function refreshData(forceReload) {
            var unitBefore = CurrentUnitId.getUnitId(),
                newCourse = CurrentCourseId.getCourseId() !== Nav.courseId
            Nav.getData(function(nav) {
                if(nav.isStudent){
                    loadAnnouncements()
                }
                var params = getJsonFromUrl();
                if(params.no_menu==1){
                    $rootScope.toggleSidebar(true);
                }

                $scope.navData = nav;
                //user is in a site, but doesn't have set due dates yet
                if(nav.isDueDateSet===false){
                    setDueDates()
                }

                $scope.getGatePage();
                if (!nav.units || !nav.units.length) return
                $scope.currentunits = nav.units;
                $scope.activePage = {id:Menu.current_id}
                var no_menu = $scope.navService.classMeta.no_menu;
                if(angular.isDefined(no_menu) && no_menu.meta_value=='1' && window.location.href.indexOf('/editor/') < 0)
                    return $scope.goToLastAction();
                if (newCourse) {
                    /*
                     Golabs 23/01/2015
                     If we have no cookie the $scope.current_unit_id will be 0
                     So the user will just be sent to the first unit in nav
                     If we do then we will send them where they left off...
                     */
                    var current = Cookiecutter.getCookiebyname('unit_id')
                    if (parseInt(current) === 0) {
                        $scope.changeToUnit(nav.units[0].id);
                    } else {
                        var found = false
                        for (var i=0; i<nav.units.length; i++) {
                            if (current == nav.units[i].id) {
                                $scope.changeToUnit(nav.units[i].id)
                                found = true
                                break
                            }
                        }
                        if (!found) {
                            $scope.changeToUnit(nav.units[0].id);
                        }
                    }
                } else {
                    $scope.changeToUnit(unitBefore);
                }
            }, forceReload,$scope.$root.doNotCalculate);
        }
        $scope.unsetCloneQuizzesFlag = function(){
            $scope.$root.cloneQuizzesDefault=false
        }
        function openCloneQuizzesFlag(then){
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/modalclonequizzesflag.html',
                controller: 'CloneQuizzesFlagController',

            });
            modalInstance.result.then(then);
        }
        function openClonePromptsFlag(then){
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/modalclonepromptsflag.html',
                controller: 'ClonePromptsFlagController',

            });
            modalInstance.result.then(then);
        }
        $scope.clonePage = function(page){
            function _clonePage(page,recalculate){
                if(!recalculate && $scope.navService.navData.orgDetails.calculate_progress &&
                    (page.is_gradeable==1 || page.layout.indexOf('quiz')>=0)
                ){
                    _clonePage(page,'now')
                }
                else{
                    var isGroup;
                    if($scope.isItemHeader(page))
                        isGroup=true;
                    EditPage.clone({
                        recalculate:recalculate,
                        pageId:page.id,
                        isGroup:isGroup,
                        cloneQuizzes:page.cloneQuizzes || ($scope.$root.cloneQuizzes && $scope.$root.cloneQuizzesDefault),
                        clonePrompts:page.clonePrompts
                    },function(response){
                        if(!angular.isDefined(response.message)){
                            console.log(_.toArray(response).join(''));
                            return;
                        }
                        refreshData(true);

                        Alerts.success({
                            title:'Clone',
                            content:response.message,
                            textOk:'Ok',
                        },function(){});

                    });
                }
            }
            if(page.layout=='quiz'){
                openCloneQuizzesFlag(function(flag){
                    page.cloneQuizzes = flag
                    _clonePage(page)
                })
            }else if(page.layout=='timed_review'){
                openClonePromptsFlag(function(flag){
                    page.clonePrompts = flag
                    _clonePage(page)
                })
            }else{
                _clonePage(page)
            }
        };
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
                            page_id: pageId,
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
            if(!recalculate) {
                Alerts.warning({
                    title: 'Delete Page',
                    content: 'Are You Sure You Want To Delete This Page',
                    textOk: 'Ok',
                    textCancel: 'Cancel'
                }, function () {
                    var page = _.findWhere($scope.navService.getPages(),{id:pageId});
                    if($scope.navService.navData.orgDetails.calculate_progress &&
                        (page.is_gradeable==1 || page.layout.indexOf('quiz')>=0)
                    ){
                        $scope.deletePage(pageId,'now')
                    }
                    else {
                        $scope.loading.deletePage = 1;
                        EditPage.del({
                            page_id: pageId,
                            recalculate: recalculate
                        }, callback);
                    }
                });
            }else{
                $scope.loading.deletePage = 1;
                EditPage.del({
                    page_id: pageId,
                    recalculate:recalculate
                }, callback);
            }
        };

        $scope.getPages = Nav.getPages.bind(Nav);
        //refreshData()
        $scope.current_course_id = CurrentCourseId.getCourseId();

        /*
         Golabs 23/01/2015
         We are going to check if we have our cookie unit_id
         If not the getCookiebyname will set a default of 0;
         */
        $scope.current_unit_id = Cookiecutter.getCookiebyname('unit_id');

        CurrentUnitId.setUnitId($scope.current_unit_id);

        function updateMenu() {
            if ($scope.current_course_id !== CurrentCourseId.getCourseId() || $scope.current_superunit_id != CurrentSuperUnitId.getId() ) {
                $scope.current_course_id = CurrentCourseId.getCourseId()
                $scope.current_superunit_id = CurrentSuperUnitId.getId()
                refreshData()
            } else if (CurrentUnitId.getUnitId() !== $scope.current_unit_id) {
                $scope.changeToUnit(CurrentUnitId.getUnitId());
            }
        }

        $scope.$on('NavUpdate', function(event, data) {
            updateMenu()

        });
        $scope.$root.$on('NavRootUpdate', function(event, data) {
            refreshData(true)
        });

        $scope.$on('NavForceReload', function(event, data) {
            refreshData(true)
        });
        $scope.$root.$on('NavRootUpdateMenu', function(event, data) {
            updateMenu()
        });
        $scope.$on('NavUpdateMenu', function(event, data) {
            updateMenu()
        });

        $scope.formatDate = function(page) {
            if(!page.class_due_date) { return; }
            var dueDate = page.class_due_date,
                format = 'MMM-DD YY';
            if($scope.navData.stylesAndColors && $scope.navData.stylesAndColors.due_date_format){
                format =  $scope.navData.stylesAndColors.due_date_format;
            }
            return moment(dueDate).format(format);
        };
        $scope.isGradeable = function(page){
            return page.is_gradeable==1  || page.layout.indexOf('quiz')>=0;
        }

        $scope.showGrade = function(nav){
            return (!nav.waitingForGrade && !nav.isExempt && ((nav.isSubmitted && nav.isGraded) || (!nav.overrideDeleted && nav.scoreOverride !== null)) && parseInt(nav.showGrades) === 1) || nav.layout == "scorm";
        };
        $scope.hideBox = function(nav){
            return nav.disableVisualIndicators;
        }
        $scope.showDate = function(nav){
            return nav.showDate=='1' && !nav.isExempt && !nav.isSubmitted && !nav.isGraded && (!nav.no_due_date || $scope.navData.isDueDateSet!==false) && ($scope.isGradeable(nav))
        }
        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }
        function getLetterGrade(percentage){
            return ShowDatesGrades.getLetterGrade($scope.courseInfo.data.rubric,percentage);
        }

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

            var class_ = $scope.courseInfo.data;
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

        $scope.showUnits = function() {

            //return true; //Golabs we should always show this as true when in Course Builder. left redundant code in for now...
            if (
                (typeof $scope.navData === 'undefined') ||
                ($scope.navData === null)
            ) {
                return false;
            }
            else if (
                (typeof $scope.navData.units === 'undefined') ||
                ($scope.navData.units === null)
            ) {
                return false;
            }

            return $scope.navData.units.length>1;
        };
        $scope.goToLastAction = function(){
            var units = $scope.navData.units,
                currentPage = $scope.navData.currentPage;
            var unitIndex = currentPage['unit']>=0?currentPage['unit']:units.length-1;
            var pageIndex = currentPage['page']>=0?currentPage['page']:units[unitIndex].pages.length-1;
            var page = units[unitIndex].pages[pageIndex];
            var pages = units[unitIndex].pages;
            var current_header_id = page.header_id;
            var total_pages = 0;
            var total_completed_pages = 0;
            var current = 1;
            if(current_header_id != 0){
                $.each(pages, function (index, value) {
                    if(value.header_id == current_header_id)
                    {
                        total_pages++;
                        if(page.id != value.id && current == 1)
                            total_completed_pages++;
                        else if(current == 1){
                            total_completed_pages++;
                            current++;
                        }
                    }
                });
            }
            setTimeout(function(){
                var width = (total_completed_pages/total_pages)*100;
                $(".new-progress-bar").width( (width != 0 ? width : 100) + '%');
            },10);
            $scope.changeToUnit(units[unitIndex]);
            Menu.current_id=page.id;
            window.location.href="/#/" + page.layout + "/" + page.id
        };


        $scope.$on('changeToUnit', function(event, id) {
            $scope.changeToUnit(id);
        })
        $scope.$on('current_unit_titleEmpty', function(event, arg) {
            $scope.current_unit_title = '';
            $scope.navData.units = {};
        });

        $scope.changeToUnit = function(unit,fromModal) {
            if (!unit.id) {
                /*
                 DSerejo 2015-02-16
                 */
                if(!angular.isDefined($scope.navData)) return false;
                unit = _.findWhere($scope.navData.units, {
                    id: unit.toString()
                }); //Golabs making sure we have a string.
            }
            if (typeof unit !== 'object') unit = $scope.navData.units[0];// could not find the unit

            // no pages??
            //if (unit.pages.length == 0) return false

            var units = Nav.navData.units
            for (var j = 0; j < units.length; j++) {
                if (parseInt(unit.id) === parseInt(units[j].id)) {
                    Currentunitkey.SetUnitKey(j);
                    $scope.current_minkey = j + 1;
                }
            }

            $scope.current_unit_id = unit.id;
            $scope.current_unit_name = unit.name;
            $scope.current_unit_image_url = unit.image_url;
            $scope.current_unit_title = unit.description;
            $scope.currentUnit = unit;
            //Golabs had to was not sticking....
            $('.arrowsmintext').html(1 + Currentunitkey.GetUnitKey());
            $scope.current_unit_title_collapsed = Currentunitkey.GetUnitKey();
            CurrentUnitId.setUnitId(unit.id)
            var lastPage = CurrentUnitId.getLast()
            CurrentUnitId.setLast(false)
            var pages = Nav.getPages();

            if(fromModal){
                return;
            }

            if (typeof pagess === "boolean")
            {
                return;
            }

            // console.log("Menu Change unit: " + angular.toJson(pages[0]));
            if($location.url().indexOf('addcontent')>=0){
                return;
            }
            var navPageLocation = 0,
                fromUrl = $location.path().split('/').slice(-1)[0];
            if($scope.$state.is('forum.dashboard')){
                fromUrl = $scope.$state.params.contentId;
            }

            if (fromUrl.trim() && +fromUrl == fromUrl) {
                for (var j = 0; j < pages.length; j++) {
                    if (fromUrl == pages[j].id) {
                        navPageLocation = j;
                    }
                }
            }
            if (lastPage) {
                navPageLocation = pages.length - 1;
                while (isSkippableMenuItem(pages[navPageLocation])) {
                    navPageLocation -= 1;
                }
            } else {
                while (isSkippableMenuItem(pages[navPageLocation])) {
                    navPageLocation += 1;
                }
            }
            if (!pages[navPageLocation]) {
                navPageLocation = 0;
            }
            /*  
             Golabs 28/01/2015
             If we have no pages then we do need this..
             only for new course with no pages...
             */

            if (typeof pages[navPageLocation] !== 'undefined'){
                if(!$scope.isPageAllowed(navPageLocation,pages[navPageLocation]).allowed)
                    return;
                if(pages[navPageLocation].layout=='header')
                    CurrentHeaderId.set(pages[navPageLocation].header_id);
            }
            if (
                (typeof pages !== 'undefined' ) &&
                (typeof pages[navPageLocation] !== 'undefined' ) &&
                (typeof pages[navPageLocation].id !== 'undefined' )
            )
            {
                Menu.current_id = pages[navPageLocation].id;
                if(window.location.href.indexOf('/editor/') >= 0)
                    $location.url("/edit" + pages[navPageLocation].layout + "/" + pages[navPageLocation].id);
                else{
                    $scope.goToPage(pages[navPageLocation].id)
                    $timeout(function(){
                        $scope.expandHeader2(pages[navPageLocation].header_id==0?pages[navPageLocation].id:pages[navPageLocation].header_id,null,navPageLocation)
                    },50)

                }


            }
            checkHasCourseDescription();
        };
        function checkHasCourseDescription(){
            var pages = $scope.getPages();
            $scope.hasCourseDescription = _.some(pages,function(p){
                return p.layout == 'course_description';
            })
        }
        $scope.getUnitButtonClass = function(id) {
            if (CurrentUnitId.getUnitId() == id) {
                return 'unit-button-active'
            }
            return 'unit-button-inactive';
        }
        $scope.expandHeader2 = function(id, event,index) {
            if(!id || $scope.noMenu()) return;
            var pages = Nav.getPages(),
                page = _.findWhere(pages, {
                    id: id
                })
            $scope.navService.currentHeaderId = id;
            $scope.navService.currentHeaderName = page.label;
            if(page.layout!='header'){
                $scope.subPages = [page];
            }
            index = index || currentPageIndex()
            if((page.layout!='header' && !$scope.isPageAllowed(index,page).allowed)||!page.permission.allowed)
                return;

            if (!page) {
                return // failed to find the page... should never happen
            }

            if (page.layout === 'header') {
                $scope.subPages = [];
                var cHead = CurrentHeaderId.get()
                if (cHead == id) {
                    CurrentHeaderId.set(0)
                } else {
                    CurrentHeaderId.set(id)
                }
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                // select the first child
                var ix = pages.indexOf(page)
                if (ix === pages.length - 1) return // no children
                var child = _.findWhere(pages, {
                    id: Menu.current_id
                })
                if (child.header_id !== getActiveNav().id)
                    $scope.goToPage(child.id)
                $scope.subPages = getSubPages(page.id);

                return
            }

            CurrentHeaderId.set(page.header_id)
            $scope.goToPage(id)

        }
        function getSubPages(headerId){
            return _.filter(Nav.getPages(),function(page){
                return page.header_id == headerId
            })
        }
        $scope.expandHeader = function(id, event,index,pages) {
            // console.log("Expand Header: " + id);

            var pages =pages || Nav.getPages(),
                page = _.findWhere(pages, {
                    id: id
                })
            if((page.layout!='header' && !$scope.isPageAllowed(index,page).allowed)||!page.permission.allowed)
                return;
            $rootScope.currentPage = page;
            if (!page) {
                return // failed to find the page... should never happen
            }

            if (page.layout === 'header') {
                var cHead = CurrentHeaderId.get()
                if (cHead == id) {
                    CurrentHeaderId.set(0)
                } else {
                    CurrentHeaderId.set(id)
                }
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                // select the first child
                var ix = pages.indexOf(page)
                if (ix === pages.length - 1) return // no children
                var child = pages[ix + 1]
                if (child.header_id !== getActiveNav().id)
                    $scope.goToPage(child.id)
                if (child.header_id !== page.id) return // no children
                $location.url("/" + child.layout + "/" + child.id);
                return
            }else{
                $scope.goToPage(page.id)
            }


            CurrentHeaderId.set(page.header_id);

            Menu.current_id = id;
        }

        $scope.isCurrentHeader = function(id) {
            return id == CurrentHeaderId.get()
        }

        $scope.isItemExpanded = function(item) {
            return (
                item.header_id == 0 ||
                item.header_id == CurrentHeaderId.get() ||
                item.header_id == item.id
            )
        }

        // TODO can we remove this? replaced by isItemExpanded
        $scope.isExpanded = function(id) {
            var pages = Nav.getPages()
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == id) {
                    if (pages[i].header_id == 0 || pages[i].header_id == CurrentHeaderId.get() || pages[i].header_id == pages[i].id) {
                        return true;
                    }
                }
            }

            return false;
        }

        $scope.isActivityHidden = function(id) {
            var pages = Nav.getPages();
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == id) {
                    if (pages[i].hide_activity == 1 || pages[i].hide_group == 1) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }

            //return false;     
        }

        $scope.isExternalLink = function(id) {
            var pages = Nav.getPages()
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == id && pages[i].layout == 'external_link') {
                    return true;
                }
            }

            return false;
        }

        $scope.isItemHeader = function(item) {
            return item.layout === 'header';
        }

        // TODO can this be removed? replaced by isItemHeader
        $scope.isHeader = function(id) {
            var pages = Nav.getPages()
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == id && pages[i].layout == 'header') {
                    return true;
                }
            }

            return false;
        }

        $scope.isGrouped = function(id) {
            var pages = Nav.getPages()
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == id && pages[i].header_id > 0) {
                    return true;
                }
            }

            return false;
        };

        $scope.isPageAllowed = function (index,page){

            var allowed = {
                allowed:true,
                reason:null
            };

            if(!page.permission.allowed || !$scope.navData.isStudent){
                return page.permission;
            }

            if(!angular.isDefined($scope.gatePage) || !angular.isDefined($scope.gatePage.page)) return allowed;
            var cur_unit = _.findWhere($scope.navData.units,{id:CurrentUnitId.getUnitId()});

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
        $scope.isChildrenChecked= function (nav,pages){
            var pages = pages || Nav.getPages();
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
        $scope.sidebarItemClass = function(id) {
            var isGrouped = false,
                returnStr = "",
                headerId;

            var pages = Nav.getPages()
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == id && pages[i].header_id > 0) {
                    isGrouped = true;
                    headerId = pages[i].header_id;
                }
            }

            if (isGrouped === true) {
                returnStr += 'sidebar-item-grouped'
                if (isActiveId($rootScope, id)) {
                    returnStr += ' sidebar-subtask-item-active';
                } else {
                    returnStr += '  sidebar-subtask-item-inactive';
                }
            } else {
                returnStr += 'sidebar-item-regular'
            }

            return returnStr;
        }


        $scope.externalLinkClicked = function(id) {
            // console.log("External Linked Clicked: " + id);

            var pages = Nav.getPages()
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == id && pages[i].layout == 'external_link') {
                    //$location.url("\/" + pages[i].layout + "\/" + pages[i].id);
                }
            }
        }
        $scope.goToPage = function(nav){
            if(nav && $scope.$state.params.contentId != nav || !$scope.$root.breadcrumbs){
                var page = Nav.getPage(nav);
                window.location.href = ("/"+$scope.getHref(_.find(Nav.getPages(),function(p){return p.id ==nav})));
                $scope.$root.breadcrumbs = []
                $scope.$root.breadcrumbs.push(breadcrumbInfo(CurrentCourseId.getCourseInfo().name));
                if($scope.useSuperUnits)
                    $scope.$root.breadcrumbs.push(breadcrumbInfo(CurrentSuperUnitId.getInfo().name));
                $scope.$root.breadcrumbs.push(breadcrumbInfo($scope.current_unit_title,$scope.changeToUnit.bind(null,$scope.current_unit_id)))
                if(page.header_id!=0){
                    $scope.$root.breadcrumbs.push(breadcrumbInfo(Nav.getPage(page.header_id).label,$scope.expandHeader.bind(null,page.header_id)));
                }
                $scope.$root.breadcrumbs.push(breadcrumbInfo(page.label))

            }
            function breadcrumbInfo(label,cb){
                return {
                    go:cb,
                    label:label
                }
            }


        }

        $scope.getHref = function(nav,index){
            index = index || currentPageIndex()
            var permission = $scope.isPageAllowed(index,nav);
            var href = permission.allowed?'#/'+nav.layout+'/'+nav.id:'#/not_allowed?reason='+permission.reason;
            if(nav.layout === 'forum')
                href += '/topics/' + nav.id;
            return href;
        }
        $scope.getEditHref = function(nav){
            var href = 'editor/#/edit'+nav.layout+'/'+nav.id
            return href;
        }
        $scope.navItemClasses = function(item,index) {
            var cls = 'sidebar-nav-item'
            if (isActiveId($rootScope, item.id)) {
                cls += ' active'
            }
            cls += ' sidebar-nav-child'

            if (!$scope.isPageAllowed(index,item).allowed){
                cls += ' not_allowed'
            }
            return cls
        }

        $scope.editItemClasses = function(item) {
            var cls = 'sidebar-nav-item sidebar-edit-item'
            if($scope.isMoving && $scope.isMoving( item.id)){
                cls += ' moving'
            }
            if (isActiveId($rootScope, item.id)) {
                cls += ' active'
            }
            if (item.header_id != '0') {
                cls += ' sidebar-edit-child'
            }
            return cls
        }

        $scope.isActive = function(id) {
            return isActiveId($rootScope, id) ? 'active' : false;
        }

        $scope.upContent = function(id) {
            EditPage.moveup({
                page_id: id
            }, function(page) {
                // console.log("UP: " + angular.toJson(page));

                // console.log("Menu SERVICE CURRENT COURSE ID: " + CurrentCourseId.getCourseId());

                refreshData(true)
            });
        }

        $scope.downContent = function(id) {
            EditPage.movedown({
                page_id: id
            }, function(page) {
                // console.log("Down: " + angular.toJson(page));


                // console.log("Menu SERVICE CURRENT COURSE ID: " + CurrentCourseId.getCourseId());

                refreshData(true)
            });
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
        $rootScope.isEnglishCurrentlySelected = $scope.isEnglishSelected();
        $rootScope.sidebarCollapsed = shouldCollapseSidebar();

        //Golabs 23/06/2015
        //If we are in a iframe we will
        //not load the left menu
        $rootScope.sidebarCollapsed = checkiniframe()
        $scope.$on('$viewContentLoaded', function(){
            if (checkiniframe()){
                document.getElementsByClassName("navbar-fixed-top")[0].style.display = 'none';
                document.getElementById("mobileBar").style.visibility = 'hidden';
                $("#coursecontentdiv").css("cssText", "margin-top: 0px !important");
                $('#sidebarCouseView').css("cssText", "top: 0px !important");
                $(".hide-menu-icon").css("cssText", "top: -41px !important");
                $(".emptydiv").css("cssText", "margin-top: -46px !important");
                $('html').css('overflow-x','hidden')
            }
        });
        window.addEventListener('orientationchange', function() {
            $rootScope.sidebarCollapsed = shouldCollapseSidebar();
            $rootScope.$digest();
        });
        if($(window).width() <768){
            $rootScope.sidebarCollapsed = true;
        }
        $rootScope.toggleSidebar = function(force) {
            //Golabs had to was not sticking....
            $('.arrowsmintext').html(1 + Currentunitkey.GetUnitKey());
            if(!$rootScope.sidebarCollapsed){
                if($(window).width() <768){
                    $("#main-content-app").css("cssText", "margin-left: 0px !important");
                }else{
                    $("#main-content-app").css("cssText", "margin-left: 15px !important");
                }
            }else {
                $("#main-content-app").css("cssText", "margin-left: 25% !important");
            }
            $rootScope.sidebarCollapsed = force || !$rootScope.sidebarCollapsed;
            var xValue = $rootScope.sidebarCollapsed?"-100%":"0";
            $('.sidebar').css({"transform": "translateX("+xValue+")"});
        }
        function currentPageIndex() {
            var curr = null;
            var pages = Nav.getPages()
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].id == Menu.current_id) {
                    curr = i;
                    break;
                }
            }
            return curr;
        }
        $scope.prev = function() {
            var index = currentPageIndex();
            var pages = Nav.getPages()
            index -= 1;
            while (isSkippableMenuItem(pages[index])) {
                index -= 1;
            }
            if (index < 0) {
                return $scope.prevUnit();
            }
            var prev = pages[index];
            if (prev == undefined) {
                return;
            }
            Menu.current_id = prev.id;
            // Why won't this work? angular's scopes are changing somehow....
            // ascope.current_header_id = prev.header_id;
            CurrentHeaderId.set(prev.header_id)
            $location.path('/' + prev.layout + '/' + prev.id);
            $rootScope.$broadcast('NavUpdateMenu');
        };

        $scope.next = function() {
            var index = currentPageIndex();
            index += 1;
            var pages = Nav.getPages()
            while (isSkippableMenuItem(pages[index])) {
                index += 1;
            }
            if (index >= pages.length) {
                return $scope.nextUnit();
            }
            var next = pages[index];
            if (next == undefined) {
                return;
            }
            var href = $scope.getHref(next,index);
            if(href.indexOf('not_allowed')<0)
                Menu.current_id = next.id;
            // Why won't this work? angular's scopes are changing somehow....
            // $scope.current_header_id = next.header_id;
            CurrentHeaderId.set(next.header_id);
            window.location.href=href;
            $rootScope.$broadcast('NavUpdateMenu');
        };

        /*
         Golabs 22/01/2015
         The nextUnit and preUnit do not seem to work from the nav-sidebar.html
         So this have now been re-written here may need to remove and relace.
         This one will go to the next unit and stop at end unit
         event trigger can be found in nav-sidebar.html in SIDEBAR COLLAPSED
         around line 88
         We will do nothing if it has reached the end just stay there
         */
        $scope.arrowminright = function() {
            var key = parseInt(Currentunitkey.GetUnitKey()) + 1;
            if (Nav.navData.units.length > key) {
                $scope.changeToUnit(Nav.navData.units[key]);
            }
        };
        /*
         Golabs 22/01/2015
         This one will go to the prev unit and stop at first unit
         event trigger can be found in nav-sidebar.html in SIDEBAR COLLAPSED
         around line 86
         We will do nothing if it has reached the beginning just stay there
         */
        $scope.arrowminleft = function() {
            var key = parseInt(Currentunitkey.GetUnitKey()) - 1;
            if (key >= 0) {
                $scope.changeToUnit(Nav.navData.units[key]);
            }
        };
        function getCurrentHeaderIndex(){
            var headers = $scope.navService.getHeaders();
            return _.findIndex(headers,function(page){
                return page.id == $scope.navService.currentHeaderId
            })
        }
        $scope.nextLesson = function() {
            var headers = $scope.navService.getHeaders();
            if(getCurrentHeaderIndex()+1 >= headers.length){
                return $scope.nextUnit();
            }
            var nextIndex = Math.min(getCurrentHeaderIndex()+1,headers.length-1);
            $scope.expandHeader2(headers[nextIndex].id,undefined,nextIndex);

        }
        $scope.prevLesson = function() {
            var headers = $scope.navService.getHeaders();
            if(getCurrentHeaderIndex()-1 < 0){
                return $scope.prevUnit();
            }
            var nextIndex = Math.max(getCurrentHeaderIndex()-1,0);
            $scope.expandHeader2(headers[nextIndex].id,undefined,nextIndex);
        }
        $scope.prevUnit = function() {
            for (var i = 0; i < $scope.navData.units.length &&
            $scope.navData.units[i].id !== $scope.current_unit_id; i++);
            if (i<= 0 || i == $scope.navData.units.length) {
                // wasn't found, or the first one
                return
            }
            CurrentUnitId.setUnitId($scope.navData.units[i - 1].id)
            CurrentUnitId.setLast(true)
            $rootScope.$broadcast('NavUpdateMenu');
        };
        $scope.nextUnit = function() {
            for (var i = 0; i < $scope.navData.units.length &&
            $scope.navData.units[i].id !== $scope.current_unit_id; i++);
            if (i >= $scope.navData.units.length - 1) {
                // wasn't found, or the last one
                return
            }
            var nid = $scope.navData.units[i + 1].id
            CurrentUnitId.setUnitId(nid)
            $rootScope.$broadcast('NavUpdateMenu');
        };
        /*
         Golabs 29/01/2015
         we need to count how many units so that
         we can see if we only have 1 mainly for
         sidebar when collapsed.
         */
        $scope.submittingIsNeeded = function(page){

            return page.allow_video_post == '1' ||
                page.allow_text_post == '1' ||
                page.allow_upload_only_post == '1' ||
                page.allow_upload_post == '1' ||
                page.is_gradeable_post == '1' ||
                page.is_gradeable_post == '1'  ||
                (page.layout && page.layout.indexOf('quiz')>=0) ||
                (page.layout && page.layout.indexOf('survey'))>=0

        }
        $scope.getNumberUnits = function() {
            if (typeof Nav.navData === 'undefined') return 0;
            else if (Nav.navData == null) return 0;
            else if (typeof Nav.navData.units === 'undefined') return 0;
            else if (Nav.navData.units == null) return 0;
            return Nav.navData.units.length;
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
        $scope.showEditButton = function(){
            var me = $scope.$root.user;
            if(!me || !Nav.navData) return false;
            return Nav.navData.isEditTeacher || me.is_super_admin || me.is_organization_admin;
        }
        $scope.showAnnouncementsButton = function(){
            return Nav.navData.isStudent
        }

        $scope.showEditClassButton = function(){
            var me = $scope.$root.user;
            if(!me || !Nav.navData) return false;
            return me.is_super_admin || me.is_organization_admin ||
                (me.org.teacher_can_edit_classes && (Nav.navData.isEditTeacher || Nav.navData.isTeacher));
        }
        $scope.openClassEdit = function(){

            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/admin/modaleditclass.html?v='+window.curretJsVersion,
                resolve:{
                    classid:function(){
                        return CurrentCourseId.data.class_id||CurrentCourseId.data.classId;
                    },
                    isAdminView:function(){
                        return false;
                    },
                    classInfo:function(){
                        return CurrentCourseId.data;
                    },
                },
                controller: 'ModalEditClassController',
                size: 'lg'
            });
        }

        $scope.$watch('current_unit_id',function () {
            $scope.$root.current_unit_id = $scope.current_unit_id;
        });

        $scope.showActivitiesModalButton = function(){
            return CurrentCourseId.getCourseInfo().show_table_of_contents == '1' && Nav.navData && (Nav.navData.isStudent || Nav.navData.isObserver) && !$scope.showEditClassButton();
        }

        $scope.$on('goToCourseView',function (eve,data) {
            if(data.unit.id != $scope.current_unit_id){
                $scope.changeToUnit(data.unit,true);
                $scope.$root.current_unit_id = $scope.current_unit_id;
            }
            $scope.expandHeader(data.navId, data.event,data.index,data.unit.pages);
        });

        $scope.openActivitiesModal = function(){
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/activities-modal.html',
                controller: 'ActivitiesModalController',
                windowClass:'activities-modal',
                resolve : {
                    courseName : function() {
                        return CurrentCourseId.getCourseInfo().name;
                    },
                    courseData : function () {
                        return JSON.parse(JSON.stringify($scope.navData));
                    },
                    current_unit_id : function () {
                        return $scope.current_unit_id;
                    },
                    courseInfo : function () {
                        return $scope.courseInfo.data;
                    },
                    isCourseView : function () {
                        return true;
                    }
                },
                scope: $scope,
                size: 'lg'
            });

            $timeout(function () {
                $('#activities-modal-body').animate({
                scrollTop: $('#activity-'+getActiveNavId($rootScope)).offset().top
                }, 800);
            });
        };

        function setDueDates(){
            var me = $scope.$root.user;
            var modalInstance = $modal.open({
                template: '<div class="modal-body">Please wait, calculating due dates..</div>',
            });
            var timeout = setTimeout(finish,10000);
            Class.calculateDueDates({
                id:CurrentCourseId.data.class_id,
                userId:me.id
            },finish,function(error){
                finish()
                Alerts.danger({
                    title:'Oops..',
                    content:'Sorry, something went wrong. If you want to report a bug or if you are having problems, please email us at support@english3.com',
                    textOk:'Ok',
                },function(){});
            });
            function finish(){
                timeout && clearTimeout(timeout);
                if(!$scope.$root.doNotCalculate){
                    $scope.$root.doNotCalculate=[];
                }
                modalInstance.close();
                $scope.$root.doNotCalculate.push(CurrentCourseId.getCourseId());
                refreshData(true);
            }
        }

    }
]);

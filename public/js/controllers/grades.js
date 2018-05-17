(function () {
    'use strict';
    function getModes(studentsResponse) {
        var modes = [];
        if (studentsResponse.org) {
            modes.push({name: 'Admin', type: 'admin'})
        }
        if (studentsResponse.classes) {
            modes.push({name: 'Teacher', type: 'teacher'})
        }
        if (studentsResponse.children) {
            modes.push({name: 'Parent', type: 'parent'})
        }
        if (studentsResponse.is_student) {
            modes.push({name: 'Student', type: 'student'})
        }
        return modes;
    }

    function  historyTimeFilters(){
        return [
            {
                code:'1D',
                label:'1 Day'
            },
            {
                code:'7D',
                label:'1 Week'
            },
            {
                code:'14D',
                label:'2 Weeks'
            },
            {
                code:'1M',
                label:'1 Month'
            },
            {
                code:'3M',
                label:'3 Months'
            },
            {
                code:'all',
                label:'All'
            },
        ]
    }
    appControllers.controller('GradesController',
        function($rootScope, $scope, $filter, $http, $q, CurrentCourseId,$modal,GradesAssignments,History, ShowDatesGrades,Grades,Gradebook,SuperunitGradesCalculator,HelperService) {

        // state
        $scope.modes = null;
        $scope.currentMode = false;
        $scope.students = null;
        $scope.history={};
        $scope.menu = {
            student: null,
            classid: null,
            selected: null
        };
        $scope.historyTimeFilters = historyTimeFilters();
        $scope.range = {
            start:moment().subtract(1,'day').format('MM/DD/YYYY'),
            end:moment().format('MM/DD/YYYY')
        };
        $scope.getTimeSpent = getTimeSpent;
        $scope.getClassAssignment = getClassAssignment;
        $scope.timeFilter = $scope.historyTimeFilters[0];
        $scope.classes = null;
        $scope.viewType={selected: 'course'};

        // $scope.assignments = [];

        $http.get('/course/students/').then(function(response) {
            $scope.modes = getModes(response.data);
            if (!$scope.modes.length) {
                return;
            }
            $scope.students = response.data;
            $scope.changeToMode($scope.modes[0].type);
            if ($scope.students.classes) {
                $scope.classesById = {};
                for (var i=0;i<$scope.students.classes.length; i++) {
                    $scope.classesById[$scope.students.classes[i].id] = $scope.students.classes[i];
                }
            }
        });
            if($(window).width() <768){
                $rootScope.sidebarCollapsed = true;
                $(".main-content").css("cssText", "margin-left: 0px !important");
            }
        $rootScope.toggleSidebar = function() {
            if(!$rootScope.sidebarCollapsed){
                $(".main-content").css("cssText", "margin-left: 0px !important");
            }else {
                $(".main-content").css("cssText", "margin-left: 330px !important");
            }
            $rootScope.sidebarCollapsed = !$rootScope.sidebarCollapsed;
            var xValue = $rootScope.sidebarCollapsed?"-100%":"0";
            $('.class-sidebar').css({"transform": "translateX("+xValue+")"});
            }
        $scope.downloadAsXls = function(){
            var data = {};
            data['totalTimeSpent']=$scope.getTotalTimeV2($scope.menu.selected);
            data['enrollmentDate']=$scope.getEnrollmentDate($scope.menu.selected);
            data['expectedEndDate']=$scope.getEndDate('expected');
            data['projectedEndDate']=$scope.getEndDate('projected');

            var student = getCurrentStudent(),
                class_ = getCurrentClass()
            var options={
                type:'csv',
                studentName:student.name,
                studentId:student.id,
                className:class_.name,
                classId:class_.id,
                gradesStyle:true,
                data:data,

            }

            Gradebook.downloadAsXls(options)
        }

        $scope.showTabs = function(){
            var me = $scope.$root.user;
            if(!me) return false;
            return me.is_teacher ||
                me.is_advisor ||
                me.is_super_admin ||
                me.is_organization_admin
        }
        $scope.showGradesDetails = function(){
            return $scope.rootAssignments;
        }
        var handleAssignmentDetails = function(response){

        };
        $scope.changeClass = function(id){
            $scope.class = id;
        };
        var handleAllClassActivity = function(response){
            $scope.allClassesHistory = [];
            $scope.classesHistory = _.filter(response.classes,function(c){return c.totalTime>0});
            $scope.totalTimeForPeriod = response.totalTime
            _.each(response.classes,function(c,key){
                var assignments = _.map(c.history,function(h,key_h){
                    h.class_name= c.name;
                    h.class_id= c.id;
                    return h;
                });
                $scope.allClassesHistory.push.apply($scope.allClassesHistory,assignments);
            });
        }

        var handleClassActivity = function(response){
            $scope.allClassesHistory =  _.map(response.classes,function(c,key){
                var history = $scope.groupAssignments(c.history)
                $.grep(history,function(u){
                    u.assignments = $scope.filterParent($scope.groupActivityHistory(u.assignments),function(page){
                        if(!angular.isDefined(page.length))
                            return parseInt(page.id)>0;
                        else{
                            for(var i in page){
                                if(page[i] != null && parseInt(page[i].id)>0)
                                    return true;
                            }
                            return false;
                        }
                    });
                });
                return {
                    history: history,
                    name: c.name,
                    id: c.id
                }
            });
        }
        $scope.getDuration = function(page){
            return Math.min(moment(page.time_out).diff(moment(page.time_in)),3600000);
        }
        $scope.getClassHistory = function(class_,all){
            $scope.classHistory = 'loading';
            $scope.loadingHistory = true;
            $scope.classesHistory = [];
            var range = angular.copy($scope.range);
            range.start = moment($scope.range.start).format('YYYY-MM-DD')
            range.end = moment($scope.range.end).format('YYYY-MM-DD')
            History.classHistoryForUser({
                class_id:all||class_.class_id,
                user_id:$scope.currentUserId,
                time:'all',
                range:range
            },function(response){
                if(angular.isDefined(response.error))
                    return;
                if($scope.contentMode=='class_activity')
                    handleClassActivity(response)
                if($scope.contentMode=='allClasses_activity')
                    handleAllClassActivity(response)
                $scope.loadingHistory = false;
            })
        };
        $scope.types = {
            history: "Entered",
            post: "Submitted",
            grade: "Feedback Received",
            quiz: "Quiz Finished"
        };


        var hasAssignemnt = function(page){
            return page.quiz_id>0 || page.max_points>0 || page.is_gradeable || page.layout.toLowerCase().indexOf("quiz")>=0;
        }

        $scope.hasActivity = function(page){
            if(page.pagegroups){
                for(var i in page.pagegroups) {
                    if($scope.hasActivity(page.pagegroups[i]))
                        return true;
                }
                return false;
            }else if(page.pages){
                for(var i in page.pages) {
                    if($scope.hasActivity(page.pages[i]))
                        return true;
                }
                return false;
            }
            return page.score
        }
        $scope.filterParent = function(pages,filterFunction){
            return $.grep(pages,function(p){
                if(p.children.length==0 && filterFunction(p.page|| p.pages))
                    return true;
                for(var i in p.children)
                    if (filterFunction(p.children[i]))
                        return true;
                return false;
            });
        };
        $scope.groupByParent = function(assignments){
            var pages = {}
            $.grep(assignments,function(a){
                if(a.pagegroupid==0 )
                {
                    if(!angular.isDefined(pages[a.page_id]))
                        pages[a.page_id]={children:[]};
                    pages[a.page_id].page=a;
                }
                else{
                    if(!angular.isDefined(pages[a.pagegroupid]))
                        pages[a.pagegroupid]={children:[]}
                    pages[a.pagegroupid].children.push(a);
                }
            });
            return _.toArray($filter('orderBy')(pages,'page.position'));
        };

        $scope.groupActivityHistory = function(assignments){
            var pages = {}
            $.grep(assignments,function(a){
                if(a.pagegroupid==0 )
                {
                    if(!angular.isDefined(pages[a.page_id]))
                        pages[a.page_id]={children:{},pages:[]};
                    pages[a.page_id].pages.push(a);
                }
                else{
                    if(!angular.isDefined(pages[a.pagegroupid]))
                        pages[a.pagegroupid]={children:{},pages:[]}
                    if(!angular.isDefined(pages[a.pagegroupid].children[a.page_id]))
                        pages[a.pagegroupid].children[a.page_id] = [];
                    pages[a.pagegroupid].children[a.page_id].push(a);
                }
            });
            for(var p in pages)
                pages[p].children = _.toArray(pages[p].children);
            return _.toArray($filter('orderBy')(pages,'page.position'));
        };


        $scope.studentName = function (student) {
            if (!student) return
            return (student.lname || student.lastName) + ", "+ (student.fname || student.firstName);
        };

        $scope.changeToMode = function (type) {
            $scope.currentMode = type;
            if (type === 'student') {
                $scope.menu.student = 'me';
            } else {
                $scope.menu.student = null;
                $scope.classes = [];
                // $scope.assignments = [];
                $scope.menu.selected = null;
            }
            if (type === 'teacher') {
                $scope.menu.classid = $scope.students.classes[0].id;
                $scope.classes = null;
            } else {
                $scope.menu.classid = null;
            }
            if (type === 'parent') {
                $scope.menu.student = $scope.students.children[0].id;
            }
            if (type === 'admin') {
                $scope.menu.student = $scope.students.org[0].id;
            }
        };

        $scope.canShowThisFormat = function (format) {
            if(!$scope.menu.selected) return false;
            var selectedClass = $scope.menu.selected;
            if(format == 'percentage')
                return selectedClass.show_grades_as_percentage == "1" || (selectedClass.show_grades_as_percentage == "0" && selectedClass.show_grades_as_score == "0")
            else
                return selectedClass.show_grades_as_score == "1" || (selectedClass.show_grades_as_percentage == "0" && selectedClass.show_grades_as_score == "0")
        };

        function getHistoryData(student){
            if(angular.isDefined($scope.history[student]))
                return;
            $http.get('/api/user/' + student+ '/history?includeInactive=1').then(function(result){
                $scope.history[student]=result.data;
            });

        }
        $scope.limit = 70;
        window.changeLimit = function(l){$scope.limit = l};
        $scope.page = 1;
        $scope.filterClasses={};


        $scope.prevPage = function(){
            $scope.page = Math.max(1,$scope.page-1);
            reloadClassData($scope.menu.classid)
        };
        $scope.nextPage = function(){
            $scope.page = Math.min($scope.studentAssignments.totalPages,$scope.page+1);
            reloadClassData($scope.menu.classid)
        };
        var searchTimeout;
        $scope.onSearchKeyUp = function(){
            searchTimeout && clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function(){
                reloadClassData($scope.menu.classid);
            },500)
        };
        function reloadClassData (classid,selectedStudentId) {
            if (!classid) {
                return;
            }
            $scope.categories = undefined;
            $scope.classes = null;
            $scope.loading = true;
            var params = {limit:$scope.limit,page:$scope.page,term:$scope.filterClasses.name};
            if($scope.nav.showUsersType == 'all')
                params.includeInactive = 1;
            if($scope.nav.showUsersType == 'removed')
                params.onlyRemoved = 1;
            $http.get('/classes/' + classid + '/gradebook?'+$.param(params)).then(function (result) {
                var curClass = $scope.classesById[$scope.menu.classid];
                $scope.studentAssignments = result.data;
                $scope.nav.activeItems = result.data.activeStudentsCount
                $scope.nav.inactiveItems = result.data.inactiveStudentsCount;
                $scope.nav.totalItems = result.data.totalStudentsCount;


                $scope.page = parseInt(result.data.page);
                $scope.maxShown = Math.min($scope.page*$scope.limit,$scope.studentAssignments.total);
                var visibleStudents = _.sortBy($filter('filter')(result.data.students,$scope.filterClasses.name),'lname');
                $scope.classes = _.map(visibleStudents, function (student) {
                    getHistoryData(student.id);
                    var item = {}
                    for (var name in curClass) {
                        if (name === 'students') continue;
                        item[name] = curClass[name];
                    }
                    item.name = $scope.studentName(student);
                    item.student_id = student.id;
                    item.is_suspended = student.is_suspended;
                    item.gender = student.gender;
                    item.site = student.siteName;
                    item.enableCreditedAssignments = result.data.enableCreditedAssignments

                    return item
                });
                prepareActiveCounters();

                $scope.nav.cache.class[classid] = $scope.nav.cache.class[classid] || {};
                $scope.nav.cache.class[classid][$scope.nav.showUsersType] = $scope.nav.cache.class[classid][$scope.nav.showUsersType] || {}
                $scope.nav.cache.class[classid][$scope.nav.showUsersType].classes = $scope.classes;
                $scope.nav.cache.class[classid][$scope.nav.showUsersType].studentAssignments = $scope.studentAssignments;

                if(selectedStudentId){
                    $scope.menu.selected = _.find($scope.classes,{'student_id':selectedStudentId})||$scope.classes[0];
                }
                else{
                    $scope.menu.selected = $scope.classes[0];
                }

                $scope.loading = false;
            },function(error){
                $scope.loading = false;
            });
        }
        $scope.nav = {showUsersType:'active',cache:{'class':{},'admin':{}}};
        var initialUserTypes = [
            {
                'id':'active',
                'label': 'Show active __items__'
            },
            {
                'id':'all',
                'label': 'Show all __items__'
            },
            {
                'id':'removed',
                'label': 'Show archived __items__'
            }
        ]
        function prepareActiveCounters(){
            $scope.nav.showUsersTypes =  angular.copy(initialUserTypes);
            _.each($scope.nav.showUsersTypes,function(i){
                i.label = i.label.replace('__items__',$scope.currentMode==='teacher'?'students':'classes')
            });
            $scope.nav.showUsersTypes[0].label += ' (' + $scope.nav.activeItems + ')'
            $scope.nav.showUsersTypes[2].label += ' (' + $scope.nav.inactiveItems + ')'
            $scope.nav.showUsersTypes[1].label += ' (' + $scope.nav.totalItems + ')'

        }
        $scope.changeActiveType = function(){
            var currentStudentClass = $scope.currentStudentClass();
            var id = currentStudentClass.mode=='class'?currentStudentClass.class.id:currentStudentClass.student.id
            if($scope.nav.cache[currentStudentClass.mode][id] && $scope.nav.cache[currentStudentClass.mode][id][$scope.nav.showUsersType]){
                $scope.classes = $scope.nav.cache[currentStudentClass.mode][id][$scope.nav.showUsersType].classes;
                if( currentStudentClass.mode=='class'){
                    $scope.studentAssignments = $scope.nav.cache[currentStudentClass.mode][id][$scope.nav.showUsersType].studentAssignments;
                    $scope.menu.selected = _.find($scope.classes,{student_id:$scope.menu.selected.student_id}) || $scope.classes[0]
                }else{
                    $scope.studentAssignments = $scope.nav.cache[currentStudentClass.mode][id][$scope.nav.showUsersType].classAssignments;
                    $scope.menu.selected = _.find($scope.classes,{class_id:$scope.menu.selected.class_id}) || $scope.classes[0]

                }

                return;
            }
            currentStudentClass.updateFn()

        };

        $scope.$watch('menu.selected.superUnitId', updateSummaryInfo);
        function updateSummaryInfo(id){
            if(_.isNull(id) || _.isUndefined(id)) return;
            $scope.loadingSuperunit = true;
            SuperunitGradesCalculator.getSuperunitGrades(id).then(
                function(progressSummary){
                    delete $scope.loadingSuperunit;
                    $scope.menu.superUnitProgressSummary = progressSummary;
                }
            )

            $scope.units = _.map($scope.superunits[id].units,function(i){
                return $scope.rootAssignments.units[i]
            })
        }
        $scope.getFromProgressSummary = function(field){
            var progressSummary = ($scope.menu.selected && $scope.menu.selected.superUnitId !== undefined? $scope.menu.superUnitProgressSummary : $scope.rootAssignments) || {};
            return progressSummary[field];
        }
        $scope.$watch('menu.classid', reloadClassData);

        function reloadStudentData(student,selectedClassId) {
            $scope.units=[];
            if (!student) {
                return;
            }
            $scope.categories = undefined;
            $scope.classes = null;
            $scope.loading = true;
            var params = {};
            if($scope.nav.showUsersType == 'all')
                params.includeInactive = 1;
            if($scope.nav.showUsersType == 'removed')
                params.onlyRemoved = 1;
            var query = {
                course_data: $http.get('/course/student?id=' + student),
                assignment_data: $http.get('/api/user/' + student + '/gradebook?' + $.param(params)),
                proficiency_classes:$http.get('/api/test/classes')

            }
            if(!angular.isDefined($scope.history[student])){
                query['history_data'] = $http.get('/api/user/' + student+ '/history?includeInactive=1');
            }
            $q.all(query).then(function (results) {

                $scope.classes = filterOutProficiencyClasses(results.assignment_data.data.classes,results.proficiency_classes.data);
                results.assignment_data.data.classes = lookForExemptedActivitiesInClasses(results.assignment_data.data.classes)
                if(results.history_data)
                    $scope.history[student]=results.history_data.data;
                $scope.classAssignments = results.assignment_data.data;

                $scope.nav.activeItems = results.assignment_data.data.activeClassesCount;
                $scope.nav.inactiveItems = results.assignment_data.data.inactiveClassesCount;
                $scope.nav.totalItems = results.assignment_data.data.totalClassesCount;

                prepareActiveCounters();

                $scope.nav.cache.admin[student] = $scope.nav.cache.admin[student] || {};
                $scope.nav.cache.admin[student][$scope.nav.showUsersType] = $scope.nav.cache.admin[student][$scope.nav.showUsersType] || {}
                $scope.nav.cache.admin[student][$scope.nav.showUsersType].classes = $scope.classes;
                $scope.nav.cache.admin[student][$scope.nav.showUsersType].classAssignments = $scope.classAssignments;

                if(selectedClassId){
                    $scope.menu.selected = _.find($scope.classes,{'class_id':selectedClassId})||$scope.classes[0];
                }
                else{
                    $scope.menu.selected = $scope.classes[0];
                }
                // $scope.assignments = results.assignment_data.data;
                $scope.loading = false;
            },function(error){
                $scope.loading = false;
            });
        }
        function filterOutProficiencyClasses(classes,proficiencyClasses){
            return _.filter(classes,function(c){
                return !_.some(proficiencyClasses,function(pc){
                    return pc.id == c.class_id
                })
            })
        }
        function lookForExemptedActivitiesInClasses(classes){
            return _.map(classes,function(class_){
               if(class_.hideExemptedActivities){
                   class_.units = filterExemptedActivities(class_.units)
               }
               return class_
            });
        }
        function filterExemptedActivities(units){
            return _.map(units,function(unit){
               unit.pagegroups =  _.map(unit.pagegroups,function(pagegroup){
                   pagegroup.pages = _.filter(pagegroup.pages,function(page){
                       return !page.isExempt
                   });
                   return pagegroup
               });
               return unit
            });
        }
        $scope.$watch('menu.student', reloadStudentData);
        $scope.hide = {}
        $scope.$watch('menu.selected', function(selected_course,old) {
            if (!selected_course || _.isEqual(selected_course,old)) return;
            $scope.hide.otherSettings = true;
            setTimeout(function(){$scope.hide.otherSettings = false;$scope.$apply()})

            $scope.rootAssignments=null;
            $scope.categories = undefined;
            $scope.units=[];
            var userid = selected_course.student_id||$scope.menu.student;

            $scope.currentUserId=userid;
            //$http.get('/assignments?userid='+ userid +'&classid=' + selected_course.class_id).then(function (result) {
            CurrentCourseId.setCourseId(selected_course.id);

            if(!selected_course.student_id){
                var class_ = _.findWhere($scope.classAssignments.classes,{id:parseInt(selected_course.class_id)});
                $scope.units = class_.units;
                $scope.superunits = class_.superunits;

                $scope.orgFlags=class_.orgFlags;

            }else{
                var student = _.findWhere($scope.studentAssignments.students,{id:selected_course.student_id});
                $scope.units = student.units;
                $scope.superunits = $scope.studentAssignments.superunits;
                $scope.menu.selected.advisors = student.advisors;
                $scope.orgFlags=$scope.studentAssignments.orgFlags
            }
            if($scope.superunits.length=== undefined){
                var fisrtSuperUnit;
                for (fisrtSuperUnit in $scope.superunits) break;
                $scope.menu.selected.superUnitId = $scope.superunits[fisrtSuperUnit].position
                $scope.superunits_ = _($scope.superunits).map(function(s){return s});
            }
            if($scope.contentMode=='class_activity'){
                $scope.getClassHistory(selected_course);
            }
            $scope.rootAssignments = getClassAssignment(selected_course);

            SuperunitGradesCalculator.init(selected_course.class_id,$scope.rootAssignments);


            //});


        });

        $scope.$watch('timeFilter',function(){
            if($scope.contentMode=='class_activity'){
                $scope.getClassHistory($scope.menu.selected);
            }
            if($scope.contentMode=='allClasses_activity'){
                $scope.getClassHistory($scope.menu.selected,-1);
            }
        });
        $scope.getUnitsOrCategories = function(){
            if($scope.viewType.selected=='course')
                return $scope.units;
            else
            {
                if($scope.categories===undefined){
                    loadCategories();
                }
                return $scope.categories;
            }


        }
        function loadCategories(){
            if($scope.loadingCategories) return;
            $scope.loadingCategories=true;
            var studentId = getCurrentStudent().id;
            var classId = getCurrentClass().id;
            $http.get('/api/user/' + studentId + '/gradebook-categories?classId='+classId).then(function(resp){
                $scope.categories = resp.data.classes[0].units;
                $scope.loadingCategories=false;
            },function(){
                $scope.loadingCategories = false;
                $scope.categories =  [];
            })

        }
        $scope.changeContentMode = function(mode){
            $scope.contentMode = mode;
        }
        $scope.formatDuration = function(duration,format){

            var units;
            if(duration<60)
                units = ["s"]
            else
                units = ["h","m"];
            format = format || units;
            var duration = moment.duration(duration*1000);
            return humanizeDuration(duration._milliseconds,
                {
                    units:format,
                    round:true
                }
            );
        };

        $scope.isWaitingGrade = function(assignment){
            return assignment.needingGrade;
        };
        function isValidNumber(num){
            return !_.isNaN(parseInt(num))
        }

        $scope.getScore = function(assignment) {
            if(!$scope.menu.selected) return;

            if(!assignment.maxScore){
                return '--'
            }
            var isOverriden = (assignment.isOverrideScore);
            var score = assignment.score;
            var max = assignment.maxScore;
            var grade ="";

            var class_ = _.findWhere($scope.classes,{class_id:$scope.menu.selected.class_id});
            if(!class_) return;
            assignment.isGraded = score===null || score===undefined;
            if(class_.show_grades_as_score==1){
                if ((assignment.isGraded) && (parseInt(score) === 0)){
                    grade+=(score||'0') + "/" + max;
                }
                grade+=(score||'--') + "/" + max;
            }
            if(class_.show_grades_as_percentage==1){
                if(score)
                    grade+="("+getScorePerc(score,max)+"%)"
            }
            if(class_.show_grades_as_letter==1){
                if(score)
                    grade+=" " + $scope.getLetterGrade(getScorePerc(score,max));
            }

            if ((assignment.isGraded) && (parseFloat(score) === 0)){
                return  grade==""?(score||'0') + "/" + max:grade;


            }
            return  grade==""?(score||'--') + "/" + max:grade;

        };
        function getScorePerc(score,max){
            return Math.round((score/max)*100)
        }

        $scope.openGradeModal = function (page,unit){
            if($scope.currentMode!='teacher') return;
            page = angular.copy(page);
            page.unit = unit;
            var student = getCurrentStudent();
            $scope.$root.classInfo = getCurrentClass()
            $modal.open({
                templateUrl: '/public/views/gradebook/modals/grade.html',
                size: 'md',
                controller: 'GradebookModalGradeController',
                resolve: {
                    params: function () {
                        return {
                            page:page,
                            student:student,
                            unit:unit,
                            reload:false,
                            enableCreditedAssignments:$scope.rootAssignments.enableCreditedAssignments

                        };
                    }
                }
            }).result.then(function(){reloadClassData($scope.$root.classInfo.id,student.id)});
        }

        $scope.openFeedback = function (feedback_){
            var feedback = angular.copy(feedback_)
            if(typeof feedback !== "object")
                feedback={id:feedback};

            var templateUrl,
                controller,
                windowClass;
            if(feedback.layout.toLowerCase()=='quiz'){
                templateUrl = '/public/views/partials/notificationgradequiz.html'
                controller = 'NotificationQuizController'
                windowClass='feedback-quiz-modal'
                feedback.page_id = feedback.id;
            }
            else if(feedback.layout.toLowerCase()=='forum'){
                templateUrl = '/public/views/partials/notificationgradeforum.html'
                controller = 'NotificationForumController'
                windowClass='feedback-quiz-modal'
                feedback.page_id = feedback.id;
            }
            else{
                feedback.id = feedback.postFeedbackId;
                templateUrl = '/public/views/partials/notificationgradepost.html?cachesmash=5'
                controller = 'NotificationGradePostMessagesController'
                windowClass='feedback-modal ' + feedback.layout.toLowerCase();

            }



            var modalInstance = $modal.open({
                templateUrl: templateUrl,
                windowClass: windowClass,
                controller: controller,
                resolve: {
                    notification: function () {
                        return feedback;
                    }
                }
            });
        };

        ShowDatesGrades.gradeScale = ShowDatesGrades.gradeScale;

        $scope.getLetterGrade = function(percentage){
            percentage = Math.round(Math.max(0,Math.min(percentage,100)));
            return ShowDatesGrades.getGradeLetterString(percentage, ShowDatesGrades.gradeScale);
        }//getLetterGrade;
        $scope.now = moment().format();
        $scope.moment = moment;
        $scope.getGraded = function(sclass) {
            var assignments = $scope.getAssignmentsForClass(sclass);
            return $filter('filter')(assignments, $scope.hasScore, true);
        };
        $scope.getAssignmentsForUnit = function(unit) {
            var assignments = [];
            for(var p=0;p< unit.pagegroups.length;p++){
                var page = unit.pagegroups[p];
                if(page.pages){
                    for(var c=0;c<page.pages.length;c++){
                        var child = page.pages[c];
                        assignments.push(child);
                    }
                }else{
                    assignments.push(page);
                }
            }
            return assignments;
        };
        $scope.getClassAssignment = getClassAssignment;
        function getClassAssignment(sclass){
            if(!sclass || !sclass.class_id ) return;


            var classAssignments;
            if(!sclass.student_id){
                var classId = sclass.class_id;
                classAssignments = _.findWhere($scope.classAssignments.classes,{id:parseInt(classId)});
            }else{
                var studentId = sclass.student_id;
                classAssignments = _.findWhere($scope.studentAssignments.students,{id:studentId});
            }
            return classAssignments
        }
        $scope.getEnrollmentDate = function(sclass) {
            var classAssignments = $scope.rootAssignments;
            if (classAssignments && classAssignments.enrollmentDate) {
                return moment(classAssignments.enrollmentDate).format('MMM Do YYYY')
            }
        };
        $scope.getFinalScore = function(sclass){
            var classAssignments;
            if(sclass){
                classAssignments = getClassAssignment(sclass)
            }else{
                classAssignments = $scope.rootAssignments;
            }

            if(classAssignments){
                var allAssignments = $scope.getAssignmentsForClass(sclass);
                if(classAssignments.finalScore){
                    if(isNaN(parseInt(classAssignments.finalScore))){
                        return classAssignments.finalScore;
                    }
                    var percent = classAssignments.finalScore/$scope.getTotalPoints(allAssignments);
                    return $scope.getLetterGrade(percent*100);
                }

            }


        };
        $scope.getEndDate = function(type){
            if(!$scope.rootAssignments) return;

            if(type=='expected'){
                return moment($scope.getFromProgressSummary('expectedEndDate')).format('MMM Do YYYY');
            }else{
                var percCompleted = $scope.getFromProgressSummary('percCompletedTasks')
                if(percCompleted==100)
                    return 'Completed'
                return moment($scope.getFromProgressSummary('projectedEndDate')).format('MMM Do YYYY');
            }
        }
        $scope.showFinalScore = function(sclass){
            var classAssignments = $scope.rootAssignments;
            if(!classAssignments) return;
            return classAssignments.finalScore;
        }
        $scope.getAssignmentsForClass = function(sclass) {
            if(!sclass || !sclass.class_id) return;


            var classAssignments;
            if(!sclass.student_id){
                var classId = sclass.class_id;
                classAssignments = _.findWhere($scope.classAssignments.classes,{id:classId});
            }else{
                var studentId = sclass.student_id;
                classAssignments = _.findWhere($scope.studentAssignments.students,{id:studentId});
            }

            var assignments = [];
            if(!classAssignments)
                return assignments;


            for(var i in classAssignments.units){
                var unit = classAssignments.units[i];
                for(var p in unit.pagegroups){
                    var page = unit.pagegroups[p];
                    if(page.pages){
                        for(var c in page.pages){
                            var child = page.pages[c];
                            assignments.push(child);
                        }
                    }else{
                        assignments.push(page);
                    }
                }
            }
            return assignments;
        };


        $scope.groupAssignments = function(assignments){
            var units = {};
            $.grep(assignments,function(a){

                if(!angular.isDefined(units[a.unit]))
                    units[a.unit]={
                        position: a.unitPosition,
                        name: a.unit,
                        assignments: []
                    };
                a.hasFeedback = a.feedback != null;
                a.isExempt = a.isExempt != '0';
                units[a.unit].assignments.push(a);
                return true;
            });

            return _.toArray($filter('orderBy')(units,'position'));
        };

        // getters on an assignment
        $scope.hasScore = function(assignment) {
            return assignment.score!==null;
        };
        $scope.isOverdue = function (assignment) {
            return new Date(assignment.due).getTime() < Date.now()
        };
        $scope.isDueNext = function (assignment) {
            return assignment.isNextDue
        };
        $scope.isSubmitted = function(assignment) {
            return assignment.isSubmitted;
        };

        $scope.getPointsGained = function(assignments) {
            var pointsGained = 0;
            angular.forEach(assignments, function(assignment) {
                pointsGained += parseInt(assignment.score || 0);
            });
            return pointsGained;
        };
        function getMode(){
            if($scope.menu.student=='me') return 'student'
            return $scope.menu.student==null?'class':'admin';
        }
        function getTimeSpent(unitid,assignmentid,pagegroupid){
            var mode = getMode();
            var studentId;
            var classId;
            if(mode=='class'){
                studentId = $scope.menu.selected.student_id;
                classId = $scope.menu.classid;
            }else{
                classId = $scope.menu.selected.class_id;
                studentId = $scope.menu.student;
            }
            var class_ = _.findWhere($scope.history[studentId].classes,{id:classId});
            var unit = _.findWhere(class_.units,{id:unitid});

            if(!assignmentid)
                return unit?$scope.formatDuration(unit.totalTime):'';
            if(pagegroupid){
                var pageGroup = _.findWhere(unit.pages,{id:pagegroupid});
                if(!pageGroup)
                    return '';
                var page = _.findWhere(pageGroup.pages,{id:assignmentid});
                return page?$scope.formatDuration(page.totalTime):'';
            }else{
                var page = _.findWhere(unit.pages,{id:assignmentid});

                return page?$scope.formatDuration(page.totalTime):'';
            }
        }

        $scope.getTotalTimeV2 = function(item,format){
            if(!item) return;
            var mode = getMode();
            var studentId;
            var classId;
            if(mode=='class'){
                if($scope.menu.classid == null) return '...'
                studentId = item.student_id;
                classId = $scope.menu.classid.split('-')[0];
            }else{
                if(item.class_id == null) return '...'
                item.class_id += ''
                classId = item.class_id.split('-')[0];
                studentId = $scope.menu.student;
            }
            if(!angular.isDefined($scope.history[studentId]))
                return '...';
            else {
                var class_ = _.findWhere($scope.history[studentId].classes,{id:classId});
                if(!class_)
                    return '';
                return $scope.formatDuration(class_.totalTime,format);
            }
        }
        $scope.getTotalTime = function(assignments,mode){

            if(mode=='class'){
                if(Grades.getClass()==assignments){
                    return Grades.getTotalTime();
                }
                Grades.setClass(assignments)
                var allAssignments = $scope.getAssignmentsForClass(assignments);
                //Maximum time = 30 minutes
                Grades.setTotalTime(_.reduce(allAssignments, function(memo, a){ return memo + parseInt(a.total_time); }, 0));
                return Grades.getTotalTime();
            }
            if(mode=='class_activity'){
                var total = _.reduce(assignments, function(memo, unit){

                    var totalUnit = _.reduce(unit.assignments,function(memoTask, task){
                        var totalTask;
                        if(task.children.length>0)
                            totalTask = parseInt($scope.getTotalTime(task.children))
                        else totalTask = parseInt($scope.getTotalTime(task.pages));
                        totalTask = isNaN(totalTask)?60:totalTask;

                        return memoTask + totalTask;
                    },0) ;
                    totalUnit = isNaN(totalUnit)?0:totalUnit;
                    return memo + totalUnit;
                }, 0);
                return total
            }

            var total = 0;
            function sumTime(assignment){
                if(assignment.type!='history')
                    return;
                total+=assignment.timeSpent*1000
            }
            angular.forEach(assignments, function(assignment) {
                if(assignment.length){
                    angular.forEach(assignment, sumTime);
                }else{
                    sumTime(assignment);
                }
            });
            return total;
        }
        $scope.getTotalPoints = function(assignments) {
            var total = 0;
            angular.forEach(assignments, function(assignment) {
                total += parseInt(assignment.points.max);
            });
            return total;
        };
        $scope.getSmiley = function(percent) {
            if (percent > 80) {
                return 'fa-smile-o';
            } else if (percent > 50) {
                return 'fa-meh-o';
            } else if ($scope.getLetterGrade(percent) == '--') {
                return 'fa-meh-o';
            } else {
                return 'fa-frown-o';
            }
        };

        $scope.getWaitingForGrade = function(assignments) {
            var submitted = $filter('filter')(assignments, $scope.isSubmitted, true);
            var graded = $filter('filter')(assignments, $scope.hasScore, true);
            return submitted.length - graded.length;
        };

        $scope.getPercent = function(assignments) {
            var graded = $filter('filter')(assignments, $scope.hasScore, true);
            return $scope.getPointsGained(graded) / $scope.getTotalPoints(graded) * 100;
        };

        $scope.late = function(assignment) {
            return $scope.now > assignment.due && !$scope.isSubmitted(assignment);
        };

        $scope.passDue = function(assignment) {
            return $scope.now > assignment.due_date;
        };

        $scope.getStatusText = function (sclass) {
            var diff = Number($scope.getFromProgressSummary('percBehind'));
            if (diff > 0) return 'Behind'
            if (diff < 0) return 'Ahead'
            return 'On Track'
        };

        $scope.getStatusPercent = function (sclass, mode,abs) {
            var diff = Number($scope.getFromProgressSummary('percBehind'));
            if(abs){
                return Math.abs(diff)
            }
            return diff;

        };

        $scope.getExpectedPercentComplete = function(sclass, mode) {
            if(!sclass) return;

            var allAssignments = getClassAssignment(sclass);

            if (mode == 'assignments') {
                return allAssignments.percExpectedTasks
            }
            else if (mode == 'score') {
                return allAssignments.percTotalScore

            }
        };


        $scope.getPercentComplete = function(sclass, mode) {
            if(!sclass) return;
            var allAssignments = getClassAssignment(sclass);
            if (mode == 'assignments') {
                return allAssignments.percCompletedTasks
            }
            else if (mode == 'score') {
                return allAssignments.percCompletedScore
            }
            else if (mode == 'date') {


            }
        };

        $scope.dueAssignments = function (sclass) {
            var now = new Date($scope.now).getTime()
            return $filter('filter')($scope.getAssignmentsForClass(sclass), function (assignment) {
                return new Date(assignment.due_date).getTime() <= now
            }, true);
        };

        $scope.getActualScore = function (sclass) {
            var score = 0;
            var total = 0;
            var dueAssignments = $scope.dueAssignments(sclass);
            angular.forEach(dueAssignments, function(assignment) {
                if(assignment.points.scoreOverride !== null && assignment.points.scoreOverride>0) {
                    score += parseInt(assignment.points.scoreOverride);
                } else {
                    score += parseInt(assignment.points.score || '0');
                }
                total += parseInt(assignment.points.max || '0');
            });
            return {score: score, total: total};
        };

        $scope.getActualScorePercent = function (sclass) {
            var res = $scope.rootAssignments;
            return res.percentComplete;
        };

        $scope.getActualAoutofB = function (sclass) {

            var res = $scope.rootAssignments;
            return parseInt(res.grandTotal) + ' out of ' + parseInt(res.grandMaxTotal);
        };

        $scope.getCompletedScore = function (sclass) {
            var score = 0;
            var total = 0;
            var dueAssignments = $scope.dueAssignments(sclass);
            angular.forEach(dueAssignments, function(assignment) {
                if(assignment.points.scoreOverride !== null && assignment.points.scoreOverride > 0) {
                    score += parseInt(assignment.points.scoreOverride);
                } else if (!assignment.points.score) {
                    return;
                } else {
                    score += parseInt(assignment.points.score || '0');
                }
                total += parseInt(assignment.points.max || '0');
            });
            return {score: score, total: total};
        };

        $scope.getCompletedScorePercent = function (sclass) {
            var res = $scope.rootAssignments;
            return parseInt(res.percentPartial);
        };

        $scope.getCompletedAoutofB = function (sclass) {
            var res = $scope.rootAssignments;
            return parseInt(res.grandTotal) + ' out of ' + parseInt(res.totalWorkedScore);
        };

        $scope.getCurrentScore = function(sclass) {
            var allAssignments = $scope.getAssignmentsForClass(sclass);
            var graded = $filter('filter')(allAssignments, $scope.hasScore, true);
            var gradedScore = 0;
            angular.forEach(graded, function(assignment) {
                gradedScore += parseInt(assignment.score);
            });
            return gradedScore;
        };

        $scope.getCurrentPossibleScore = function(sclass) {
            var allAssignments = $scope.getAssignmentsForClass(sclass);
            var graded = $filter('filter')(allAssignments, $scope.hasScore, true);
            var allScore = 0;
            angular.forEach(graded, function(assignment) {
                allScore += parseInt(assignment.total);
            });
            return allScore;
        };

        $scope.getTotalPossibleScore = function(sclass) {
            var allAssignments = $scope.getAssignmentsForClass(sclass);
            var allScore = 0;
            angular.forEach(allAssignments, function(assignment) {
                allScore += parseInt(assignment.total);
            });
            return allScore;
        };

        $scope.getCurrentIndexForProgress = function(now, assignments) {
            var assignments = $filter('orderBy')(assignments, '+due');
            var i = 0;
            angular.forEach(assignments, function(assignment, key) {
                if (now > assignment.due) {
                    i++;
                }
                if (now <= assignment.due) {
                    return key;
                }
            });
            return i;
        };

        $scope.getCurrentScorePercent = function(sclass, mode) {
            var total = 0;
            if (mode == 'final') {
                total = $scope.getTotalPossibleScore(sclass);
            } else if (mode == 'current') {
                total = $scope.getCurrentPossibleScore(sclass);
                if (total == 0) {
                    return 0;
                }
            }
            return (100 * ($scope.getCurrentScore(sclass) / total));
        };
        $scope.showAsScore=function(){
            if(!$scope.menu.selected) return;
            var class_ = _.findWhere($scope.classes,{class_id:$scope.menu.selected.class_id});;
            if(!class_) return;
            return class_.show_grades_as_score==1||
                class_.showGradesAsScore ||
                (class_.show_grades_as_score==0&&class_.show_grades_as_percentage==0&&class_.show_grades_as_letter==0);
        }
        $scope.showAsPercentage=function(){
            if(!$scope.menu.selected) return;
            var class_ = _.findWhere($scope.classes,{class_id:$scope.menu.selected.class_id});;
            if(!class_) return;
            return class_.show_grades_as_percentage==1||
                class_.showGradesAsPercentage ||
                (class_.show_grades_as_score==0&&class_.show_grades_as_percentage==0&&class_.show_grades_as_letter==0);
        }
        $scope.showAsLetter=function(){
            if(!$scope.menu.selected) return;
            var class_ = _.findWhere($scope.classes,{class_id:$scope.menu.selected.class_id});;
            if(!class_) return;
            return class_.show_grades_as_letter==1 || class_.showGradesAsScore;
        }
        function getCurrentStudent(){
            var mode = getMode();
            var studentId,
                name,firstName,lastName,
                student;
            $scope.menu.selected = $scope.menu.selected || {};
            if(mode=='class'){
                studentId = $scope.menu.selected.student_id
                name = $scope.menu.selected.name;
                firstName = $scope.rootAssignments.firstName;
                lastName = $scope.rootAssignments.lastName;
                student = $scope.menu.selected
            }else{
                studentId = $scope.menu.student=='me'?$scope.$root.user.id:$scope.menu.student
                student =_.findWhere($scope.students.children,{id:studentId}) ||_.findWhere($scope.students.org,{id:studentId});
                name = $scope.menu.student=='me'?$scope.studentName($scope.$root.user):$scope.studentName(student)

            }

            return {
                id:studentId,
                name:name,
                lastName:lastName,
                firstName:firstName,
                student:student,
                isMe:$scope.menu.student=='me'
            };

        }
        function getCurrentClass(){
            var mode = getMode();
            if(mode=='class'){
                return  {
                    id:$scope.menu.classid||$scope.menu.selected.class_id,
                    name:$scope.menu.selected.course_name,
                    courseid:$scope.menu.selected.courseid||$scope.menu.selected.course_id,
                    courseId:$scope.menu.selected.courseid||$scope.menu.selected.course_id,

                };
            }
            return {
                id:$scope.menu.selected.class_id,
                courseid:$scope.menu.selected.courseid||$scope.menu.selected.course_id,
                courseId:$scope.menu.selected.courseid||$scope.menu.selected.course_id,
                name:$scope.rootAssignments.name,
            };;
        }
        $scope.currentStudentClass = function(){
            var student = getCurrentStudent()
            student.units = $scope.units;
            student.letterTotalScore = $scope.rootAssignments.letterTotalScore;
            student.totalScore = $scope.rootAssignments.totalScore;
            student.percTotalScore = $scope.rootAssignments.percTotalScore;
            var class_ = getCurrentClass();
            var mode = getMode();

            var updateFn;
            if(mode=='class'){
                updateFn = reloadClassData.bind(null,class_.id,student.id)
            }else{
                updateFn = reloadStudentData.bind(null,student.id,class_.id)
            }

            return {
                mode: mode,
                student:student,
                class:class_,
                isInline:true,
                updateFn:updateFn
            }
        }
        $scope.openTimeEngagement = function(forCurrentClass){
            var classId;
            if(forCurrentClass)
                classId = getCurrentClass().id
            $modal.open({
                templateUrl: '/public/views/grades/activity-report-modal.html',
                controller: ['$scope','student','class_','$modalInstance',function($scope,student,class_,$modalInstance){
                    $scope.student = student;
                    $scope.class_ = class_;
                    $scope.cancel = $modalInstance.dismiss
                }],
                resolve:{
                    student:getCurrentStudent,
                    class_:function(){return classId}
                },
                size:'lg',
                windowClass:'modal-time-engagement'

            });
        }
        $scope.openRubric = function(assignment){
            var selected = $scope.menu.selected
            var mode = getMode();
            var studentId;
            if(mode=='class')
                studentId = selected.student_id;
            else
                studentId = $scope.menu.student;

            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/student/rubric-modal.html',
                controller: 'RubricStudentController',
                resolve:{
                    data:function(){
                        return {
                            pageid:assignment.id,
                            rubricid:assignment.rubricId,
                            userid:studentId
                        }
                    }
                }

            });
        }

        $scope.assignmentDueDate = function(assignment){
            if(assignment.due_date)
                return moment(assignment.due_date).format('D MMM')
        }
        $scope.recalculate = function (sclass){
            if(!sclass || !sclass.class_id ) return;
            var classId,
                studentId,
                mode;
            if(!sclass.student_id){
                classId = sclass.class_id;
                studentId = $scope.menu.student;
                mode='student'
            }else{
                studentId = sclass.student_id;
                classId = $scope.menu.classid;
                mode='class'
            }
            sclass.recalculating = true;
            Gradebook.recalculateGrades({
                classId:classId,
                userId:studentId
            },function(ok){
                sclass.recalculating = false;
                if(mode=='class'){
                    reloadClassData(classId);
                }else{
                    reloadStudentData(studentId);
                }
            },function(error){
                sclass.recalculating = false;
            });
        }
    });

})();

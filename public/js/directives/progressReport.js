angular.module('app')


.directive('progressReport',
[   '$q',
    '$modal',
    '$filter',
    'Site',
    'Assignment',
    'Class',
    'OrganizationV2',
    'UserV2',
    'Gradebook',
    'ShowDatesGrades',
    'HelperService',
    function($q,$modal,$filter,Site,Assignment,Class,OrganizationV2,UserV2,Gradebook,ShowDatesGrades,HelperService) {

        return {
            restrict: 'E',
            scope: {
                gradesView:'=',
                orgId:'=?'
            },
            templateUrl: '/public/views/directives/progressReport.html',
            link: function ($scope, $element) {
                var FILTERS = {
                    'site':{name: "Site",reload:reloadSites,id:'siteId'},
                    'course':{name: "Course",reload:reloadCourses,id:'classId'},
                    'teacher':{name: "Teacher",reload:reloadTeachers,id:'teacherId'},
                    'advisee':{name: "Advisee",reload:reloadAdvisee,id:'studentId'}
                }
                $scope.getLetter = ShowDatesGrades.getLetterGrade;
                var me = $scope.$root.user;
                $scope.selected = {};
                $scope.filters = {};
                $scope.filterOptions = {};
                $scope.selectedFilterIds = {};
                $scope.selected.filters  = [];
                $scope.selectedFilters = {};
                $scope.loading = {};
                $scope.toRoles='Students';


                if($scope.gradesView && !(me.is_organization_admin || me.is_super_admin)) {
                    $scope.filters = [];
                    if(me.is_site_admin){
                        addFilter(FILTERS.site);
                        addFilter(FILTERS.advisee);
                    }
                    if(me.is_teacher && !me.is_advisor){
                        $scope.selectedFilters.Course = true
                        toggleFilter(FILTERS.course)
                        reloadCourses(null,true);
                    }
                    if(!me.is_teacher && me.is_advisor){
                        $scope.selectedFilters.Advisee = true
                        toggleFilter(FILTERS.advisee)
                        reloadAdvisee();

                    }
                    if(me.is_teacher && me.is_advisor) {
                        addFilter(FILTERS.course);
                        addFilter(FILTERS.advisee);
                        $scope.selectedFilters.Advisee = true
                        toggleFilter(FILTERS.advisee)

                    }
                }
                else {
                    $scope.filters = [
                        FILTERS.site,
                        FILTERS.course,
                        FILTERS.teacher,
                        FILTERS.advisee
                    ];
                    $scope.selectedFilters.Site = true
                    toggleFilter(FILTERS.site)
                }
                function addFilter(filter){
                    var hasFilter = _.findWhere($scope.filters,{'name':filter.name})
                    if(!hasFilter){
                        $scope.filters.push(filter);
                    }
                    
                }

                $scope.toggleFilter = toggleFilter
                function toggleFilter(filter){
                    if($scope.selectedFilters[filter.name]){
                        if($scope.selected.filters.indexOf(filter)<0){
                            $scope.selected.filters.push(filter);
                            reloadAll(filter);
                        }

                    }else{
                        var index = $scope.selected.filters.indexOf(filter);
                        if(index>=0){
                            if($scope.selectedFilterIds[filter.id]){
                                delete $scope.selectedFilterIds[filter.id];
                            }
                            $scope.selected.filters.splice(index,1);
                            reloadAllAfterIndex(index);
                        }

                    }
                };
                $scope.filterHasChanged = function(filter,reload){
                    if(!(reload && filter && filter.value)) return;

                    if(filter.name==='Site'){
                        $scope.users = filter.value.users;
                        indexUsers();
                    }
                    if(filter.name==='Advisee'){
                        if(filter.value.id==='all'){
                            $scope.users = filter.value.users;
                        }else{
                            $scope.users = [filter.value];
                        }
                        indexUsers();
                    }
                    else if(filter.name==='Course'){
                        // $scope.users = filter.value.users.students;
                        // indexUsers();
                    }
                    reloadAll(filter,true);
                };
                function reloadAll(changedFilter,reloadNext,doNotReload){
                    var found = false;
                    $scope.oldSelectedFilterIds = $scope.selectedFilterIds;
                    $scope.selectedFilterIds = {};

                    for(var i = 0;i<$scope.selected.filters.length;i++){
                        var filter = $scope.selected.filters[i];
                        if(filter===changedFilter){
                            found = true;
                        }

                        if(found){
                            if(reloadNext && filter.value){
                                $scope.selectedFilterIds[filter.id] = filter.value.id;
                            }
                            if(!reloadNext && !doNotReload)
                                return reloadAllAfterIndex(i);
                            reloadNext = false;
                        }
                        else{
                            if(filter.value){
                                $scope.selectedFilterIds[filter.id] = filter.value.id;
                            }
                        }
                    }

                }
                function reloadAllAfterIndex(index){
                    index = index || 0;
                    if($scope.selected.filters.length>index){
                        var filter = $scope.selected.filters[index];
                        filter.reload(reloadAllAfterIndex.bind(null,index+1));
                    }
                }
                $scope.$watch('selected.filter',function(filter){
                    for(var i = 0;i<$scope.selected.filters.length;i++){

                    }
                },true);

                function allWithProgress(promises, progress) {
                    var total = Object.keys(promises).length;
                    var now = 0;
                    angular.forEach(promises,function(p) {
                        p.then(function() {
                            now++;
                            progress(parseInt(now / total*100));
                        });
                    })
                    return $q.all(promises);
                }

                $scope.getUsers = function (){
                    if(!$scope.selected.filters.length) {
                        toastr.error('Select at least one filter');
                        return;
                    }
                    var lastFilter = $scope.selected.filters[$scope.selected.filters.length-1];
                    var promises = {}
                    $scope.classes=[];

                    $scope.reportWasLoaded = false;
                    $scope.loading.users=true;
                    if(lastFilter.name==='Course'){
                        Gradebook.getProgressReport(
                            _.extend({
                                'classId':lastFilter.value.id,
                                'groupId':lastFilter.value.groupId,
                                'includeInactive':$scope.selected.includeInactive?1:0,
                            },$scope.selectedFilterIds),function(class_) {
                                $scope.classes = [class_];
                                $scope.loading.users = false;
                                $scope.reportWasLoaded = true;
                            },function(error){
                                $scope.loading.users=false;
                                $scope.error = error.error;
                            })

                    }
                    else if(['Site','Advisee'].indexOf(lastFilter.name)>=0){
                        $scope.classes=[];
                        for(var i in $scope.users){
                            if($scope.users[i].id!='all')
                                promises[$scope.users[i].id]=Gradebook.getProgressReportForUser(_.extend({
                                    userId:$scope.users[i].id,
                                    includeInactive:$scope.selected.includeInactive
                                },$scope.selectedFilterIds)).$promise;
                        }
                        allWithProgress(promises,function(progress){
                            $scope.loading.percentage = progress;
                        }).then(function (results) {
                            for(var i in results){
                                $scope.users[$scope.indexedUsers[i]].classes=results[i].classes;
                                $scope.users[$scope.indexedUsers[i]].guardians=results[i].guardians;
                            }
                            $scope.loading.users=false;
                            $scope.reportWasLoaded = true;
                        });
                    }

                    else if(lastFilter.name==='Teacher'){
                        $scope.classes=[];
                        $scope.users=[];
                        $scope.loading.percentage = 0;
                        getUserClasses(getFilterFromId('teacherId').value.id,loadGradebook);
                        function loadGradebook(classes){
                            for(var i in classes){
                                promises[classes[i].id]=Gradebook.getProgressReport(_.extend({
                                    'includeInactive':$scope.selected.includeInactive?1:0,
                                    'classId':classes[i].id
                                },$scope.selectedFilterIds)).$promise
                            }
                            allWithProgress(promises,function(progress){
                                $scope.loading.percentage = progress;
                            }).then(function (results) {
                                for(var i in results){
                                    $scope.classes= $scope.classes.concat(results[i]);
                                }
                                $scope.loading.users=false;
                                $scope.reportWasLoaded = true;

                            },function(error){

                            });

                        }

                    }
                }
                $scope.sortBy = function(obj,predicate){
                    if(!obj.sort){
                        obj.sort = {by:'lastName',reverse:false}
                        return;
                    }
                    if(obj.sort.by==predicate)
                        obj.sort.reverse=!obj.sort.reverse;
                    else{
                        obj.sort.reverse=false;
                        obj.sort.by=predicate;
                    }
                }
                $scope.formatDate = function(str){
                    return moment(str).format('MMM Do YYYY');
                }
                $scope.recalculate = function(userId,classId){
                    $scope.classes=[];
                    $scope.loading.users = true;
                    if(!userId){
                        if(!confirm('We will recalculate the numbers for all students in this class. It may take several minutes.' +
                                ' Are you sure you want to proceed?')){
                            return;
                        }
                    }
                    Gradebook.recalculateGrades(
                        {
                            userId:userId,
                            classId:classId
                        },function(result){
                            $scope.getUsers();
                        },function(error){

                        }
                    )
                }


                function indexUsers(){
                    $scope.indexedUsers={};
                    for(var i in $scope.users){
                        $scope.indexedUsers[$scope.users[i].id]=i
                    }
                }
                function reloadSites(cb){
                    $scope.filterOptions.Site = []
                    $scope.loading.options = true
                    Site.getOrgSites(
                        _.extend({'orgId': $scope.orgId},$scope.selectedFilterIds),
                        function(sites){
                            $scope.sites = sites;
                            prepareSites($scope.selected.includeInactive);

                            $scope.loading.options = false;
                            cb && cb()
                        },
                        function(error){
                            $scope.loading.options = false;
                            $scope.error = error.error;
                        }
                    );
                }
                function prepareSites(includeInactive,selectedId){
                    $scope.filterOptions.Site = $filter('orderBy')(_.map($scope.sites,function(site){
                        var s = angular.copy(site);
                        s.name = s.name + ' ('+siteUserCount(s)+')';
                        return s;
                    }),'name');
                    selectedId = selectedId || $scope.oldSelectedFilterIds.siteId;
                    if(selectedId){
                        var filter = getFilterFromId('siteId');
                        filter.value = _.findWhere($scope.filterOptions.Site,{id:selectedId});
                    }
                    function siteUserCount(s){
                        if(includeInactive){
                            return s.users?s.users.length:0;
                        }
                        return _.filter(s.users,function(u){return u.classesCount>0}).length
                    }
                }
                function reloadCourses(cb,is_teacher,selectedId){
                    $scope.filterOptions.Course=[]
                    $scope.loading.options = true;
                    selectedId = selectedId || $scope.oldSelectedFilterIds.classId;
                    var params = _.extend({
                        as:'teacher',
                        includeInactive:$scope.selected.includeInactive?1:0
                    },$scope.selectedFilterIds);

                    Class.query(params,
                        function(courses){
                            $scope.filterOptions.Course = $filter('orderBy')(_.map(courses,function(c){
                                c.name = c.name + ' ('+c.studentCount+')';
                                return c
                            }),'name');
                            var filter = getFilterFromId('classId');
                            if(is_teacher){
                                filter.value = _.findWhere(courses,{id:$scope.$parent.menu.classid});
                                $scope.getUsers();
                            }
                            if(selectedId){
                                setTimeout(function(){
                                    filter.value = _.findWhere($scope.filterOptions.Course,{id:selectedId});
                                    $scope.$apply();
                                },100)

                            }
                            $scope.loading.options = false;
                            cb && cb()
                        },
                        function(error){
                            $scope.loading.options = false;
                            $scope.error = error.error;
                        }
                    )
                }
                function reloadTeachers(cb){
                    $scope.filterOptions.Teacher=[]
                    var selectedId =  $scope.oldSelectedFilterIds.teacherId;
                    OrganizationV2.getUsers(_.extend({
                        id:$scope.orgId,
                        asTeacher:true,
                        all:me.is_super_admin,
                    },$scope.selectedFilterIds),function(users){
                        for(var i in users){
                            users[i].name = users[i].lastName + ", " +  users[i].firstName;
                        }
                        $scope.filterOptions.Teacher = $filter('orderBy')(users,'name');
                            var filter = getFilterFromId('teacherId');
                            if(selectedId && filter){

                                setTimeout(function(){
                                    filter.value = _.findWhere($scope.filterOptions.Teacher,{id:selectedId});
                                    $scope.$apply();
                                },100)

                            }
                        cb && cb()
                    },function(error){
                        $scope.loading.options = false;
                        $scope.error = error.error;
                    }

                    )
                }
                function reloadAdvisee(cb){
                    $scope.filterOptions.Advisee=[];
                    $scope.loading.options = true;
                    UserV2.getUser(null,$.param($scope.selectedFilterIds)).then(
                        function(me){
                            for(var i in me.advisees){
                                me.advisees[i].name = me.advisees[i].lastName + ", " +  me.advisees[i].firstName;
                            }
                            me.advisees = $filter('orderBy')(me.advisees,'name');
                            var all = {id:'all',name:"All",users:angular.copy(me.advisees)}
                            me.advisees.unshift(all);

                            $scope.filterOptions.Advisee = me.advisees;

                            $scope.loading.options = false;
                            $scope.selected.filter=$scope.filterOptions.Advisee[0];
                            cb && cb()
                        },
                        function(error){
                            $scope.loading.options = false;
                            $scope.error = error.error;
                        }
                    )

                }
                $scope.changeSelectInactive = function(isSelected){
                    if(getFilterFromId('siteId')){
                        prepareSites(isSelected,$scope.selectedFilterIds.siteId);
                    }
                    if(getFilterFromId('classId')){
                        reloadCourses(null,false,$scope.selectedFilterIds.classId);
                    }
                };
                function getFilterFromId(id){
                    return _.findWhere($scope.selected.filters,{id:id})
                }
                function getUserClasses(id,then){
                    if($scope.selectedFilterIds.classId){
                        return then([{id:$scope.selectedFilterIds.classId}]);
                    }
                    UserV2.getUser(id).then(function(user){
                        then(user.classes);
                    })
                }
                $scope.canSendReport = function(){
                    if(!$scope.users) return;
                    for(var i=0;i<$scope.users.length;i++)
                        if($scope.users[i].classes)
                            return true;
                    return false;
                }
                $scope.openSendReport = function(){
                    var reports = prepareStudentReports();
                    if(!reports.length) return;

                    $modal.open({
                            template:'<send-progress-report is-opened="isOpened" reports="reports" org-id="orgId"></send-progress-report>',
                            controller:['$scope','$modalInstance','reports','orgId',function($scope,$modalInstance,reports,orgId){
                                $scope.reports = reports;
                                $scope.orgId = orgId;
                                $scope.isOpened=true;
                                $scope.$watch('isOpened',function(isOpened){
                                    if(isOpened===false) $modalInstance.dismiss();
                                })
                            }],
                            resolve:{
                                reports:function(){return reports},
                                orgId:function(){return $scope.orgId}
                            },
                            windowClass:'send-report-modal'
                        }
                    )
                };
                function prepareStudentReports(){
                    var reports = _.filter($scope.users,function(user){
                        return user.selected;
                    });
                    if(!reports.length){
                        toastr.error('Select at least one student');
                        return;
                    }

                    return _.map(reports,function(student){
                        student.classes = _.map(student.classes,function(class_){
                            class_['printableGradeOnCompletedWork']=class_.hasNotLoggedIn?"Hasn't logged in":(class_.percCompletedScore+'%' + (class_.showGradesAsLetter==1?' ('+class_.letterCompletedScore+')':''));
                            class_['printableCurrentOverallGrade']=class_.hasNotLoggedIn?"Hasn't logged in":prepareCurrentGradeOverall(class_);
                            class_['printableExpectedSoFar']=class_.percExpectedTasks+'%';
                            class_['printableCompletedSoFar']=class_.percCompletedTasks+'%';
                            class_['printableCourseStart']=$scope.formatDate(class_.enrollmentDate);
                            class_['printableCourseEnd']=$scope.formatDate(class_.expectedEndDate);
                            class_['printableProjectedEndDate']=$scope.formatDate(class_.projectedEndDate);
                            return class_;
                        })
                        function prepareCurrentGradeOverall(class_){
                            var text = class_.percExpectedOrCompletedScore+'%' + (class_.showGradesAsLetter==1?' ('+class_.letterExpectedOrCompletedScore+')':'');
                            text+=$scope.preparePercBehind(class_);
                            return text;
                        }
                        return student;
                    })
                }
                $scope.downloadAsCsv = function(){
                    var options={
                        type:'csv',
                        data:$scope.classes.length?$scope.classes:$scope.users,
                        tables:$scope.classes.length?'classes':'users',
                        filename:$scope.selected.filters[0].name
                    }
                    Gradebook.downloadAsCsv(options,function(response){
                        HelperService.buildFileFromData(response.content,response.filename);
                    })
                }
                $scope.hasAdvisorAbilities = function(){
                    var u = $scope.$root.user,lastFilter;
                    if($scope.selected.filters.length)
                        lastFilter = $scope.selected.filters[$scope.selected.filters.length-1];

                    return (u.is_advisor || u.is_organization_admin || u.is_super_admin) && lastFilter && lastFilter.id === 'studentId'
                }
                $scope.stopPropagation = function(evt){
                    evt.stopPropagation();
                }
                $scope.collapseOrExpandAll = function(collapse){
                    angular.forEach($scope.users,function(user){
                        user.collapse=collapse;
                    })
                }
                $scope.selectOrUnselectAll = function(select){
                    angular.forEach($scope.users,function(user){
                        if(user.classes && (user.classes.length || Object.keys(user.classes).length))
                            user.selected=select;
                    })
                }
                $scope.preparePercBehind = function(progressReportEntry){
                    var text = '';
                    if(progressReportEntry['percBehind']>0){
                        text+=' (' + progressReportEntry['percBehind'] + '% behind)';
                    }else if (progressReportEntry['percBehind']<0){
                        text+=' (' + -progressReportEntry['percBehind'] + '% ahead)';
                    }
                    return text;
                }


            }
        }

    }
]
);
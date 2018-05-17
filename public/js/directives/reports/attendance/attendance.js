"use strict";

(function () {
    var app = angular.module('app');
    app.directive('attendanceDatepicker',['$timeout',function($timeout){
        return{
            restrict: 'E',
            controller:function($scope,$element){
                $scope.open = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $timeout(function(){$element.find('ul.dropdown-menu').css('left', '-187px')})
                    $scope.opened = true;
                };
                $scope.dateOptions = {
                    formatYear: 'yyyy',
                    startingDay: 1
                };
                $scope.format = 'yyyy-MM-dd ';

            }
        }
    }])
    app.directive('attendanceReport',
        [ '$q',
            '$timeout',
            '$filter',
            'Report',
            'UserV2',
            'Attendance',
            'Site',
            'OrganizationV2',
            'Class',
            'Alerts',
            'User',
            'AttendanceReportValidator',
            'AttendanceReportDatepicker',
            'AttendanceReportExporter',
            'AttendanceReportSync',
            'HelperService',
            '$location',
            '$modal',
            'StudentsMissingAttendance',
            function($q,$timeout,$filter,Report,UserV2,Attendance,Site,OrganizationV2,Class,Alerts,User,Validator,Datepicker,Exporter,Sync,HelperService,$location,$modal,StudentsMissingAttendance) {
                return {
                    restrict: 'E',
                    scope: {

                    },
                    templateUrl: '/public/views/directives/reports/attendance.html?v='+window.currentJsVersion,
                    link: function ($scope, $element,$attrs) {

                        if(!$scope.$root.me){
                            UserV2.getUser().then(function(me){$scope.$root.me=me;$scope.isGuardian = $scope.$root.me.childrenV2.length>0});
                        }
                        if(!$scope.$root.user){
                            User.get({userId:'me'},function(user){
                                $scope.isAdvisor=user.is_advisor
                            })
                        }
                        Datepicker.init($scope);
                        $scope.Datepicker = Datepicker;
                        $scope.attendanceExporter = Exporter.attendanceExporter($scope)
                        $scope.getStudentReport = getStudentReport;

                        $scope.getAndPrepareReport = getAndPrepareReport;
                        $scope.getReport = getReport;
                        $scope.reloadAdvisees = reloadAdvisees;
                        $scope.canSave = canSave;
                        $scope.dayHasErrors = dayHasErrors;
                        $scope.rowStatus = rowStatus;
                        $scope.isAdmin =isAdmin;
                        $scope.toggleAll = toggleAll;
                        $scope.toggleAbsent = toggleAbsent;
                        $scope.toggleOnlyMissing = toggleOnlyMissing;
                        $scope.stopPropagation = stopPropagation;
                        $scope.getCalculatedTime=getCalculatedTime;
                        $scope.getTotalTime = getTotalTime;
                        $scope.save = save;
                        $scope.suspend = suspend;
                        $scope.setReason = setReason;
                        $scope.saveAll = saveAll;
                        $scope.changeUnit=changeUnit;


                        $scope.getMissing = getMissing;
                        $scope.isStudentMissingAttendance = StudentsMissingAttendance.isStudentMissingAttendance
                        $scope.selectAll = selectAll;
                        $scope.downloadMissingAttendance = downloadMissingAttendance;


                        $scope.isEmptySelectedList = isEmptySelectedList;


                        $scope.checkAsColumns=checkAsColumns;
                        $scope.toggleAvailableColumn=toggleAvailableColumn;
                        $scope.getLayouts =getLayouts;
                        $scope.saveLayout =saveLayout;
                        $scope.filterLayouts =filterLayouts;
                        $scope.canSaveLayout= canSaveLayout;
                        $scope.newLayout= newLayout;
                        $scope.deleteLayout= deleteLayout;


                        $scope.user = $scope.$root.user;




                        $scope.loading={};
                        $scope.select={};
                        $scope.filteredStudents = {};

                        $scope.$watch('selected.site',changeSite);
                        $scope.$watch('selected.advisor',changeAdvisor);
                        $scope.$watch('selected.class',changeClass);
                        $scope.$watch('selected.type',changeType);
                        $scope.$watch('selected.date',Datepicker.changeDate);
                        $scope.$watch('selected.editLayout',changeLayout);
                        $scope.$watch('config.show_withdrawn',function(){
                            if($scope.config.show_withdrawn!==undefined){
                                $scope.filterWithdrawnStudents();
                            }
                        });
                        $scope.$watch('config.export.selectedColumns',buildPreview,true);
                        $scope.$watch('config.showLayoutCreator',createAvailableColumnLayout);
                        $scope.$watch('selected.tab',function(tab){
                            if(!tab) return;
                            $scope.filterWithdrawnStudents();
                        });
                        $scope.$watch('isGuardian',function(isGuardian){
                            if(isGuardian){
                                getMissing(false,'1900-01-01');
                            }
                        });
                        $scope.$watch('advisees',function(advisees){$scope.download.options.data.advisees=advisees});
                        $scope.$watch('selected.startDate',function(date){
                            $scope.filterWithdrawnStudents();
                            $scope.download.options.data.startdate=moment(date).format('YYYY-MM-DD')
                        });
                        $scope.$watch('selected.endDate',function(date){
                            $scope.download.options.data.enddate=moment(date).format('YYYY-MM-DD')
                            if($scope.selected.startDate>date){
                                $scope.selected.startDate = date;
                            }
                        });
                        $scope.$watch('download.options.data.exportType',function(type){
                            if(type && $scope.attendanceExporter.previewTable){
                                $scope.attendanceExporter.previewDownload()
                            }
                        })
                        $scope.$root.$watch('me',function(me){
                            if(!me) return;

                            if(isAdmin()){
                                startForAdmin()
                            }else{
                                startForAdvisor()
                            }
                            getLayouts();
                        });

                        var originalContainers = {}
                        $scope.filterWithdrawnStudents = function(){
                            if(!originalContainers.sites) return
                            var allStudents = $scope.config.show_withdrawn || $scope.selected.tab=='report',
                                sites = cloneSites(),
                                currentSite = $scope.selected.site,
                                totalStudents = 0;

                            $scope.select.sites = _.map(sites,function(s){
                                if(s.students){
                                    if(!allStudents)
                                        s.students = _.filter(s.students,function(student){
                                        return Datepicker.isBeforeWithdraw(getMinDate(),student)
                                    })
                                    s.count = s.students.length;
                                    s.text= s.name + '(' + s.count + ')'
                                    totalStudents += s.count
                                }
                                return s;
                            });
                            $scope.select.sites[0].text = 'All sites ('+totalStudents+' students)';
                            if(currentSite && currentSite.value != 'all'){
                                $scope.selected.site = _.findWhere($scope.select.sites,{id:currentSite.id});
                                changeSite($scope.selected.site)
                                reloadAdvisees();
                            }else{
                                changeSite(currentSite)
                                reloadAdvisees();
                            }
                            setTimeout(function(){$scope.$apply()})
                        }
                        function cloneSites(sites){

                            var newContainer;
                            sites = sites || originalContainers.sites
                            if(sites && !sites.length){
                                newContainer = {}
                                for(var i in sites){
                                    var originalStudents = _.clone(sites[i].students);
                                    newContainer[i] = _.extend({},sites[i],{students:originalStudents});
                                }
                                return newContainer;
                            }
                            newContainer = [];
                            sites.forEach(function(s){
                                if( s.students){
                                    var originalStudents = s.students;
                                    s.students = [];

                                    originalStudents.forEach(function(student){
                                        s.students.push(jQuery.extend(true, {}, student))
                                    })
                                }

                                newContainer.push(jQuery.extend(true, {}, s))
                            })
                            return newContainer;
                        }
                        function getMinDate(){
                            if($scope.selected.tab=='input')
                                return $scope.selected.type=='day'?$scope.selected.date:$scope.download.options.data.startdate
                            return $scope.selected.startDate


                        }
                        function getMaxDate(){
                            if($scope.selected.tab=='input')
                                return $scope.selected.type=='day'?$scope.selected.date:$scope.download.options.data.enddate
                            return $scope.selected.endDate


                        }
                        function startForAdmin(){
                            Report.getSites(function(sites,error){
                                originalContainers.sites = _.clone(sites);
                                $scope.filterWithdrawnStudents()
                            },$scope.loading);
                            Report.getCoaches(function(coaches,error){
                                $scope.select.advisors = coaches;
                                originalContainers.advisors = _.clone(coaches);
                            },$scope.loading);
                            Report.getClasses(function(classes,error){
                                $scope.select.classes = classes;
                            },$scope.loading);
                            $scope.Sync = Sync.init($scope);
                            $scope.Sync.refreshQueue()
                        }
                        function startForAdvisor(){
                            $scope.advisees=getStudents();
                            if($scope.$root.me.advisees.length){
                                $scope.select.sites={}
                                _.each($scope.advisees,function(s){
                                    if(!$scope.select.sites[s.site]){
                                        $scope.select.sites[s.site]={
                                            name: s.site,
                                            students:[]
                                        };
                                    }
                                    $scope.select.sites[s.site].students.push(s);

                                })
                                originalContainers.sites = angular.copy($scope.select.sites)
                                $scope.filterWithdrawnStudents()

                            }

                            $scope.select.sites = _.map($scope.select.sites,function(s){
                                if(s.students){
                                    s.count = s.students.length;
                                    s.text= s.name + '(' + s.count + ')'
                                }

                                return s;
                            });
                        }
                        function getDateRange(){
                            var date = $scope.selected.date;
                            if($scope.selected.type=='day'){
                                return {
                                    minDate:moment(date).format('YYYY-MM-DD'),
                                    maxDate:moment(date).format('YYYY-MM-DD'),
                                }
                            }
                            else{
                                return {
                                    minDate:moment($scope.datePicker.startWeek).format('YYYY-MM-DD'),
                                    maxDate:moment($scope.datePicker.endWeek).format('YYYY-MM-DD'),
                                }
                            }
                        }
                        function startPagination(perPage,keepPage){
                            $scope.pageSize = perPage || 20;
                            $scope.numberOfPages=Math.ceil($scope.config.searchStudents.length/$scope.pageSize);
                            if(keepPage && $scope.config.currentPage!==undefined){
                                $scope.config.currentPage=Math.min($scope.numberOfPages-1,$scope.config.currentPage);
                            }else
                                $scope.config.currentPage=0;
                        }
                        function getAttendance(studentIds,specificDates){
                            var paramsAttendance;
                            if(specificDates)
                            {
                                if(typeof specificDates === 'object')
                                    paramsAttendance = specificDates;
                                else
                                    paramsAttendance = {dates:specificDates}
                            }

                            else
                                paramsAttendance = getDateRange();
                            paramsAttendance.users=studentIds;
                            if($scope.selected.filter=='course'){
                                paramsAttendance.classId=$scope.selected.class;
                            }
                            return Attendance.all(paramsAttendance).$promise;
                        }
                        function getMissing(download,startDate){
                            var paramsAttendance = {
                                minDate:moment(startDate || $scope.selected.startDate).format('YYYY-MM-DD'),
                                maxDate:moment($scope.selected.endDate).format('YYYY-MM-DD'),
                            }
                            if($scope.selected.filter=='course'){
                                paramsAttendance.classId=$scope.selected.class;
                            }
                            paramsAttendance.users=_.map($scope.advisees,function(a){return a.id});
                            if(download){
                                paramsAttendance.download=true;
                                var options = {
                                    httpMethod:'POST',
                                    data:paramsAttendance
                                }
                                $.fileDownload('/api/attendance/missing', options);
                            }
                            else{
                                $scope.missingAttendance = [];
                                $scope.showMissingWarning = false;
                                $scope.loadingMissing = true;
                                Attendance.getMissing(paramsAttendance,
                                    function(users){
                                        $scope.missingAttendance=users.users;
                                        if(users.users.length==0)
                                            $scope.showMissingWarning = true;
                                        mapPendingDays()
                                        refreshDatePicker()
                                        delete $scope.loadingMissing
                                    },
                                    function(error){
                                        delete $scope.loadingMissing
                                    }
                                )
                            }
                        }
                        $scope.openEnterMissingAttendanceModal = function(student,date){
                            $modal.open({
                                templateUrl:'/public/views/directives/reports/enter-missing-attendance-modal.html',
                                controller:['$scope','student','date','$modalInstance',function($scope,student,date,$modalInstance){
                                    $scope.student = student;
                                    $scope.date = date;
                                    $scope.cancel = $modalInstance.dismiss;
                                }],
                                resolve:{
                                    student:function(){return student},
                                    date:function(){return date},
                                },
                                scope:$scope,
                                windowClass: 'enter-missing-attendance-window'
                            })
                        }
                        $scope.toggleMissingAttendanceStudentPanel = function(student){
                            if($scope.config.missingReport.includeDates)
                                student.opened=!student.opened
                        }
                        $scope.mapPendingDays = mapPendingDays;

                        function mapPendingDays(){
                            $scope.pendingDays = [];
                            $scope.userPendingDays ={};
                            _.each($scope.missingAttendance,function(student){
                                if($scope.config.missingReport.onlyNotReportedAtAll && studentHasAnyAttendanceForDateRange(student))
                                    return;
                                _.each(student.classes,function(c){
                                    _.each(c.dates,function(d){
                                        if(student.datesWithAttendance && student.datesWithAttendance.hasOwnProperty(d))
                                            return;
                                        if($scope.pendingDays.indexOf(d)<0)
                                            $scope.pendingDays.push(d);
                                        if(!$scope.userPendingDays.hasOwnProperty(student.id)){
                                            $scope.userPendingDays[student.id] = {
                                                id:student.id,
                                                name: student.lastName + ', ' + student.firstName,
                                                phone: student.phone,
                                                totalAttendance: student.totalAttendance? student.totalAttendance:0,
                                                dates: []
                                            };
                                        }
                                        if($scope.userPendingDays[student.id].dates.indexOf(d)<0)
                                            $scope.userPendingDays[student.id].dates.push(d);

                                    })
                                })
                            })
                            reloadFilteredStudents($scope.config.filterMissing)
                            refreshMissingAttendancePagination()
                        }
                        function studentHasAnyAttendanceForDateRange(student){
                            return (student.datesWithAttendance && Object.keys(student.datesWithAttendance).length)
                        }
                        $scope.$watch('config.filteredPending',refreshMissingAttendancePagination);
                        $scope.$watch('config.filterMissing',reloadFilteredStudents)
                        function reloadFilteredStudents(filterString){
                            if($scope.userPendingDays){
                                var filtered = $filter('filterByName')($scope.userPendingDays,filterString);
                                $scope.config.filteredPending = _.sortBy(filtered,'totalAttendance')

                            }
                        }
                        function refreshMissingAttendancePagination(users){
                            if(!users) return;
                            $scope.missingAttendancePag = {
                                currentPage:0,
                                pageSize:20,
                                numberOfPages:Math.ceil(Object.keys(users).length/20)
                            };

                        }
                        function selectAll(array,checked){
                            _.each(array, function(el){
                                el.selected = checked;
                            })
                        }
                        function downloadMissingAttendance(){
                            Exporter.missingAttendance.export(_.filter($scope.userPendingDays,function(s){
                                return s.selected;
                            }),$scope.config.missingReport);
                        }
                        function isEmptySelectedList(array){
                            for(var i in array){
                                if(array.hasOwnProperty(i)){
                                    if(array[i].selected)
                                        return false;
                                }
                            }
                            return true;
                        }
                        function reloadAdvisees(){

                            $scope.report = {};
                            _.each($scope.advisees,function(student){
                                $scope.report[student.id]=angular.copy(student);
                                $scope.report[student.id].loading=true;
                            });
                            $scope.showReport=true;
                            startPagination($scope.selected.filter=='course'?$scope.advisees.length:undefined);
                            $timeout(getAndPrepareReport,10);
                        }
                        function getReport(studentIds,specificDates,report){
                            var queryUser=UserV2.getSpecificUsers({users:studentIds,'includeHistoryClasses':true}).$promise;
                            var queryAttendance=getAttendance(studentIds,specificDates);

                            queryUser.then(function(students){
                                _.each(students,function(data){
                                    var key = data.userId;
                                    if(!data.trackAttendance){
                                        delete report[key];
                                        return;
                                    }

                                    data.classes =filterOutClassesOutsideDateRange(
                                        mergeAttendanceOnlyAndNormalClasses(data.classes,data.attendanceOnlyClasses)
                                    )

                                    if(!data.classes.length){
                                        report[key].hide=true;
                                        report[key].noClasses=true;
                                        $scope.showWarning = true;
                                        return;
                                    }
                                    if($scope.selected.filter=='course'){
                                        data.classes=_.filter(data.classes,function(c){return c.id==$scope.selected.class+'*0'});
                                    }
                                    data.timeUnit='hours';
                                    _.each(data.classes,function(c){
                                        c.loading = c.loading===undefined?true:c.loading;
                                        c.attendance={}
                                    });

                                    report[key]=data;
                                    report[key].loading=true;
                                    report[key].absent={};
                                    report[key].attendance={};
                                    report[key].reason={};
                                    report[key].approved={};
                                    report[key].pending={};
                                    report[key].addWithdrawDate = _.isString(report[key].attendanceWithdrawDate)

                                });

                                queryAttendance.then(function(students){

                                    _.each(students,function(student,key){


                                        if(key=="" || key.substr(0,1)=='$' || !report[key] )
                                            return;

                                        report[key].missing_Dates=student.missing_Dates;
                                        report[key].totalAttendance= student.totalAttendance;

                                        report[key].loading=false;
                                        if(report[key].hide) return;
                                        if(student.timeSpent){
                                            _.each(student.timeSpent.classes,function(c){
                                                var sClass =  _.find(report[key].classes,function(class_){return class_.id== c.id+'*0'});
                                                if(!sClass) return;
                                                sClass.dates = c.dates;
                                                sClass.calculatedTimeSpent= c.totalTime;
                                            })
                                            _.each(report[key].classes,function(c){
                                                delete c.loading;
                                            })
                                        }

                                        _.each(student.classes,function(c){
                                            var sClass =  _.find(report[key].classes,function(class_){return class_.id== c.id});

                                            _.each(c.dates,function(date){
                                                if(report[key].absent[date.date]!==false){
                                                    if(date.absent){
                                                        report[key].absent[date.date]=true;
                                                        toggleAbsent(date.absent,date.date,report[key]);
                                                    }else{
                                                        report[key].absent[date.date]=false;
                                                    }

                                                }

                                                if(date.approved){
                                                    report[key].approved[date.date]=true;
                                                }else{
                                                    report[key].pending[date.date]=true;
                                                }
                                                if(sClass)
                                                    sClass.attendance[date.date]=Datepicker.formatTime(report[key],date.time);
                                            });
                                            _.each(c.dates,function(date){
                                                if(date.reason)
                                                    prepareAbsentReason(date,key);
                                            })
                                        })
                                        report[key].original = angular.copy(report[key]);
                                    })

                                },function(error){
                                    _.each(report,function(r){
                                        r.loading = false;
                                    })
                                });
                            })
                            return queryAttendance;


                        }
                        function filterOutClassesOutsideDateRange(classes){
                            return _.filter(classes,function(c){
                                return !($scope.Datepicker.isOutsideClassDateRange(c,null,getMinDate()) && $scope.Datepicker.isOutsideClassDateRange(c,null,getMaxDate()))
                            })
                        }
                        function getAndPrepareReport(runEvents,specificDates){
                            if(runEvents){
                                $timeout(getAndPrepareReport,10);
                                return;
                            }
                            startPagination($scope.selected.filter=='course'?$scope.advisees.length:undefined,true);
                            if(!($scope.config.filteredStudents && $scope.config.filteredStudents.length)) return;

                            var studentIds = _.map(_.filter($scope.config.filteredStudents,function(student){
                                    return student.loading==true;
                                }),function(a){
                                    return a.id
                                }
                            );

                            if($scope.advisees.length){
                                $scope.showReport=true;
                            }

                            $scope.showWarning = false;
                            getReport(studentIds,specificDates,$scope.report).then(function(){
                                $scope.firstReportCreated = true;
                                refreshDatePicker();

                            })
                        }
                        function prepareAbsentReason(date,key){
                            var reason = {label:date.reason},
                                custom
                            if(date.reason.indexOf(':')>0){
                                reason = _.findWhere($scope.config.absentReason.options,{label:date.reason.split(':')[0]})
                                custom = date.reason.split(':')[1].trim()
                            }
                            setReason($scope.report[key],date.date,reason);
                            if(custom)
                                $scope.report[key].reason[date.date].custom = custom;


                        }
                        function mergeAttendanceOnlyAndNormalClasses(normalClasses,attendanceOnlyClasses){
                            normalClasses = _.map(normalClasses,function(c){
                                c.id += '*0';
                                c.attendanceOnly=false
                                return c;
                            })
                            attendanceOnlyClasses = _.map(attendanceOnlyClasses,function(c){
                                c.id += '*1';
                                c.attendanceOnly=true
                                return c;
                            })
                            Array.prototype.push.apply(normalClasses,attendanceOnlyClasses);
                            return normalClasses;
                        }
                        function stopPropagation(event){
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        function toggleAbsent(isAbsent,date,student){
                            if(isAbsent){
                                _.each(student.classes,function(c){
                                    c.attendance[date]=null;
                                })
                            }else{
                                delete student.reason[date]
                                delete student.absent[date]
                            }
                        }
                        function toggleOnlyMissing(onlyMissing){
                            _.each($scope.report,function(student){
                                if(!onlyMissing)
                                    student.hide=false;
                                else{
                                    var missing = false;
                                    var missingClass = _.find(student.classes,function(class_){
                                        return angular.equals({},class_.attendance);
                                    })
                                    if(missingClass)
                                        student.hide=false;
                                    else
                                        student.hide=true;
                                }
                            })
                        }
                        function toggleAll(flag){
                            _.each($scope.report,function(s){
                                s.show=flag
                            })
                        }
                        function changeUnit(student,newUnit,event){
                            var oldUnit = student.timeUnit
                            student.timeUnit=newUnit;
                            _.each(student.classes,function(c){
                                _.each(c.attendance,function(time,date){
                                    var seconds = moment.duration(parseFloat(time),oldUnit).asSeconds()
                                    c.attendance[date]=Datepicker.formatTime(student,seconds);
                                })
                            })

                            stopPropagation(event);
                        }
                        function changeLayout(layout){
                            if(!layout) return;
                            $scope.config.export.selectedColumns=[]
                            createAvailableColumnLayout(false,true);

                            _.each(layout.columns,function(c){
                                toggleAvailableColumn(c.name);
                                var col= _.find($scope.config.export.selectedColumns,function(col){return col.name==c.name})
                                col.asColumns= c.asColumns
                                checkAsColumns(col);
                                $scope.config.export.layoutName = layout.name
                                $scope.config.export.share = layout.share
                                $scope.config.export.timeUnit = layout.timeUnit||'minutes'
                                $scope.config.export.timeSeparator = layout.timeSeparator||'-'
                            })
                            buildPreview();
                        }
                        function changeType(type){
                            if(!type) return;
                            if(type=='day'){
                                $scope.days=[1];
                            }
                            else{
                                $scope.days=[1,2,3,4,5,6,7];
                                Datepicker.selectWeek($scope.selected.date);
                            }
                            refreshDatePicker()
                            Datepicker.changeDate($scope.selected.date);
                            $scope.report={};

                        }
                        function refreshDatePicker(){
                            if($scope.$root.refreshDatepicker)
                                $scope.$root.refreshDatepicker();
                        }
                        function changeClass(class_){
                            if(!class_) return;
                            $scope.selected.site=null;
                            $scope.selected.advisor=null;
                            $scope.advisees=null;
                            $scope.download.options.data.classId=class_;
                            if($scope.selected.class !==null && !$scope.advisees){
                                Class.get({id:$scope.selected.class,includeUsers:1},
                                    function(class_){
                                        $scope.advisees = class_.users.students;
                                    },
                                    function(error){}
                                )
                            }
                        }
                        function getStudents(){
                            return $scope.$root.me.advisees.length?$scope.$root.me.advisees:$scope.$root.me.childrenV2;
                        }
                        function hasFilter(){
                            return $scope.selected.site||$scope.selected.class||$scope.selected.advisor
                        }
                        function changeAdvisor(advisor){
                            if(!$scope.$root.me) return;

                            if(!advisor){
                                if(!hasFilter()){
                                    $scope.advisees = getStudents();
                                }
                            }
                            else{
                                $scope.selected.site=null;
                                $scope.selected.class=null;
                                $scope.advisees = advisor.students
                            }
                        }
                        function changeSite(site){
                            if(!$scope.$root.me) return;
                            if(!site){
                                if(!hasFilter()){
                                    $scope.advisees = getStudents();
                                }
                            }
                            else{
                                $scope.selected.advisor=null;
                                $scope.selected.class=null;
                                if(site.value=='all'){
                                    var advisees = [];
                                    _.each($scope.select.sites,function(s){
                                        if(s.students)
                                            advisees = advisees.concat(s.students);
                                    })
                                    $scope.advisees=advisees;
                                }
                                else{
                                    $scope.advisees = site.students;
                                }
                            }
                        }
                        function getTotalTime(direction,params){
                            var totalTime;
                            if(direction=='h'){
                                var s = params.student;
                                var date = Datepicker.getDateString(params.day)
                                totalTime = _.reduce(s.classes,function(memo,c){
                                    if(params.calculated){
                                        if(c.dates && c.dates[date])
                                            return memo + c.dates[date].totalTime;
                                        else return memo
                                    }else{
                                        var att = parseFloat(c.attendance[date]);
                                        att = isNaN(att)?0:att;
                                        return c.attendance[date]?memo + att:memo
                                    }
                                },0)
                            }
                            else if(direction=='v'){
                                var s = params.student;
                                var c = _.find(s.classes,function(c){return c.id == params.class.id});
                                if(params.calculated){
                                    totalTime = _.reduce(c.dates,function(memo,d){
                                        return memo+ d.totalTime
                                    },0);
                                }else{
                                    totalTime = _.reduce(c.attendance,function(memo,d){
                                        var att = parseFloat(d);
                                        att = isNaN(att)?0:att;
                                        return memo+ att
                                    },0);
                                }

                            }else if(direction=='both'){
                                totalTime = 0;
                                _.each($scope.days,function(day){
                                    totalTime+=getTotalTime('h',{day:day,student:params.student});
                                })
                            }
                            return params.calculated?Datepicker.formatTime(params.student,totalTime):totalTime;
                        }

                        function getCalculatedTime(student,class_,day){
                            var dateString = Datepicker.getDateString(day);
                            return class_.dates&&class_.dates[dateString]?Datepicker.formatTime(student,class_.dates[dateString].totalTime):'0';

                        }


                        function canSave(student){
                            return student.saving!=1;
                        }

                        function dayHasErrors(student,day){
                            if(!student.daysWithErrors  || !student.daysWithErrors.indexOf) return false;
                            return student.daysWithErrors.indexOf(Datepicker.getDateString(day))>=0
                        }
                        function rowStatus(student,day){
                            if(student.approved[$scope.Datepicker.getDateString(day)])
                                return 'Approved'
                            else if(student.pending[$scope.Datepicker.getDateString(day)]){
                                return 'Pending'
                            }else return 'Missing'
                        }
                        function saveAll(event,approve){
                            var loadingAction = approve?'approving':'saving'
                            $scope.config[loadingAction] = 1;
                            var hasError = false;
                            function next(i,event,approve){
                                var student = $scope.config.filteredStudents[i];
                                if(!student) {
                                    $scope.config[loadingAction]=hasError?2:0
                                    return;
                                }
                                if(!studentHasChanges(student)){
                                    next(i+1,event,approve)
                                    return;
                                }
                                delete student.error
                                save(student,event,approve).then(function(){
                                    next(i+1,event,approve)
                                },function(error){
                                    student.error = error;
                                    if(!hasError){
                                        window.location.href='#'+student.userId;
                                        window.scrollBy(0,-60);
                                        student.show=true;
                                        hasError = true;
                                    }
                                    next(i+1,event,approve)
                                })
                            }
                            next(0,event,approve);
                        }
                        function studentHasChanges(student){
                            var original = student.original;
                            var current = angular.copy(student);
                            delete current.original;
                            delete current.show;
                            return !_.isEqual(current,original);
                        }

                        function save(student,event,approve){
                            var loadingAction = approve?'approving':'saving',
                                saveAction = approve?'approve':'save';

                            student[loadingAction] = 1;
                            var classes = [];
                            var hasAttendance = false;
                            var show60Days6Aknowledge  = false;
                            _.each(student.classes,function(c){
                                var dates=[];
                                _.each($scope.days,function(d){
                                    var date = $scope.Datepicker.getDateString(d);
                                    var time = c.attendance[date];
                                    if(!Datepicker.isBeyondToday(date,1) && !Datepicker.isBeyondWithdraw(date,student) && (student.absent[date] || time)){
                                        hasAttendance = true;
                                        var reason;
                                        if(student.reason[date])
                                            reason = student.reason[date].customHelperText?student.reason[date].label+": " + student.reason[date].custom:student.reason[date].label;
                                        dates.push({
                                            'date':date,
                                            'time':moment.duration(parseFloat(time),student.timeUnit).asSeconds(),
                                            absent:student.absent[date],
                                            reason: reason
                                        });
                                    }
                                    if($scope.Datepicker.isBefore60Days(moment(date),true)){
                                        show60Days6Aknowledge = true;
                                    }
                                })
                                classes.push({
                                    id: c.id,
                                    dates:dates
                                })
                            });
                            var days = _.filter(_.map($scope.days,function(d){
                                if(!Datepicker.isBeyondToday(d) && !Datepicker.isBeyondWithdraw(d,student))
                                    return Datepicker.getDateString(d);
                            }),function(d){return d})
                            delete student.daysWithErrors;

                            var promise = Validator.validate(student,classes,days,hasAttendance);
                            promise.then(
                                function(){
                                    if(show60Days6Aknowledge){
                                        Validator.acknowledge60Days(days,$scope.Datepicker).then(finishSaving,
                                            function(error){
                                                student[loadingAction] = 2
                                            })
                                    }else
                                        finishSaving();
                                    function finishSaving(){
                                        Attendance[saveAction]({
                                                userId:student.userId,
                                                attendanceWithdrawDate:student.addWithdrawDate?moment(student.attendanceWithdrawDate).format('YYYY-MM-DD'):undefined,
                                                classes:classes
                                            },
                                            function(ok){
                                                student[loadingAction] = 0
                                                _.each(days,function(d){
                                                    if(hasAttendance){
                                                        if(!approve && !student.approved[d])
                                                            student.pending[d]=true
                                                        else if(approve){
                                                            delete student.pending[d]
                                                            student.approved[d]=true
                                                        }
                                                    }
                                                })
                                            },
                                            function(error){
                                                student[loadingAction] = 2
                                            }
                                        )
                                    }

                                },
                                function(error){
                                    student[loadingAction] = 2;
                                    student.daysWithErrors = error.options.days;
                                    toastr.error(error.message)
                                }
                            )
                            event.stopPropagation();
                            return promise


                        }
                        function getStudentReport(download){
                            if(moment($scope.selected.startDate)>moment($scope.selected.endDate)){
                                toastr.error("Start date must be before end date");
                                return
                            }
                            Attendance.studentReport({
                                userId:$scope.selected.advisee.id,
                                startDate:moment($scope.selected.startDate).format('YYYY-MM-DD'),
                                endDate:moment($scope.selected.endDate).format('YYYY-MM-DD'),
                                'export':download,
                                includeProgress:$scope.download.options.data.includeProgress
                            },function(response){
                                if(response.content)
                                    HelperService.buildFileFromData(response.content,response.filename);
                                else
                                    $scope.studentReport = response;
                            })
                        }
                        function suspend(student,$event){
                            $modal.open({
                                templateUrl:'/public/views/directives/reports/suspend-modal.html',
                                backdrop: 'static',
                                controller:['$modalInstance','$scope',function($modalInstance,$scope){
                                    $scope.cancel = $modalInstance.dismiss
                                    $scope.canSave = function(){return $scope.reason};
                                    $scope.ok = function(){$modalInstance.close($scope.reason)}
                                },
                                ]

                            }).result.then(function(sReason){

                                    _.each($scope.days,function(day){
                                        var reason = _.findWhere($scope.config.absentReason.options,{label:'Suspended'});
                                        var dateString = $scope.Datepicker.getDateString(day);
                                        student.absent[dateString] = true;
                                        setReason(student,dateString,reason);
                                        student.reason[dateString].custom = sReason;
                                    })
                                })
                            $event.stopPropagation();
                        }
                        function setReason(student,date,reason){
                            student.reason[date]=angular.copy(reason);
                        }
                        function isAdmin(){
                            if(!$scope.$root.me) return false;
                            return $scope.$root.me.isSuperAdmin ||
                                ($scope.$root.me.privileges && $scope.$root.me.privileges.length)
                        }

                        function createExampleData(){
                            var classes=[{
                                id:'1',
                                name:'Class A',
                            },{
                                id:'2',
                                name:'Class B',
                            }];
                            var date1 = moment().format('YYYY-MM-DD')
                            var date2 = moment().subtract(1, 'day').format('YYYY-MM-DD')
                            var dates=[date1,date2];

                            var students=[{
                                id:'1',
                                name:'Student A',
                                classes:[{
                                    id:'1',
                                    name:'Class A',
                                    dates:[1,1],
                                    attendance:2
                                },{
                                    id:'2',
                                    name:'Class B',
                                    dates:[2,1],
                                    attendance:3
                                }]
                            },{
                                id:'2',
                                name:'Student B',
                                classes:[{
                                    id:'1',
                                    name:'Class A',
                                    dates:[1,2],
                                    attendance:3
                                },{
                                    id:'2',
                                    name:'Class B',
                                    dates:[3,3],
                                    attendance:6
                                }]
                            }]
                            //studentId,studentName,lmlId,className,date,attendance
                            var table=[
                                ['1','Student A','1','Class A',date1,0,1,'Reason1','','','1'],
                                ['1','Student A','1','Class A',date2,1,0,'','','','1'],
                                ['1','Student A','2','Class B',date1,2,0,'','','','0'],
                                ['1','Student A','2','Class B',date2,1,0,'','','','0'],
                                ['2','Student B','1','Class A',date1,3,0,'','','','0'],
                                ['2','Student B','1','Class A',date2,2,0,'','','','0'],
                                ['2','Student B','2','Class B',date1,0,1,'Reason2','','','1'],
                                ['2','Student B','2','Class B',date2,4,0,'','','','1'],

                            ];
                            $scope.config.export.example={
                                classes:classes,
                                dates:dates,
                                students:students,
                                table:table
                            }
                        }

                        function buildPreview(force){
                            if(!$scope.config.export.selectedColumns.length)
                                return;
                            if($scope.config.disableAutoPreview)
                                return;

                            var selectedGroups = {};

                            _.each($scope.config.export.selectedColumns,function(col){
                                if(col.obj && !selectedGroups[col.obj])
                                    selectedGroups[col.obj]=col.tblIndex;
                            });

                            var groupedTableTmp = _.groupBy($scope.config.export.example.table,function(row){
                                var index = '';
                                _.each(selectedGroups,function(group){
                                    index +='|'+row[group];
                                });
                                return index;
                            });

                            var groupedTable = [];
                            _.each(groupedTableTmp,function(group) {
                                var row = {};
                                var totalAttendance = _.reduce(group, function (memo, r) {
                                    return memo + r[5];
                                }, 0);
                                var groupedRow = angular.copy(group[0]);

                                //atendance
                                groupedRow[5] = totalAttendance;
                                groupedTable.push(groupedRow);
                            })

                            var finalTable=[];
                            var header=[];
                            var rowToColumns={};

                            var asColumnIndex;
                            _.each($scope.config.export.selectedColumns,function(col){
                                if(col.asColumns){
                                    asColumnIndex=col.tblIndex;
                                    _.each(groupedTable,function(group){
                                        var colName=group[col.tblIndex];
                                        if(!rowToColumns[colName]){
                                            rowToColumns[colName]=0;
                                        }
                                        if(!_.findWhere(header,{tblIndex:colName})){
                                            var colValue = rowToColumns[colName];
                                            header.push({
                                                name:colName,
                                                label:colName,
                                                tblIndex:colName
                                            });
                                            _.each(groupedTable,function(group){
                                                if(!group[colName])
                                                    group[colName]=0;
                                            });
                                        }
                                    })
                                }else{
                                    header.push(col);
                                }
                            });
                            if(asColumnIndex){
                                groupedTable= _.groupBy(groupedTable,function(r) {
                                    var index = '';
                                    _.each(selectedGroups, function (group) {
                                        if(group!=asColumnIndex)
                                            index += '|' + r[group];
                                    });
                                    return index;
                                });
                                groupedTable= _.map(groupedTable,function(g){
                                    var row = g[0];
                                    _.each(g,function(r){
                                        row[r[asColumnIndex]]+=r[5];
                                    })

                                    return row;
                                });
                            }



                            _.each(groupedTable,function(group){
                                var row = {};
                                _.each(header,function(col){
                                    row[col.name]=group[col.tblIndex]
                                });
                                finalTable.push(row);
                            });

                            $scope.config.export.preview={
                                header:header,
                                rows:finalTable
                            }
                            var a =0;
                        }

                        function createAvailableColumnLayout(flag,forceReload){
                            if((!flag || $scope.config.export.availableColumns.length) && !forceReload)
                                return;

                            createExampleData();
                            $scope.config.export.availableColumns=[
                                {
                                    name:'Student Name',
                                    label:'Student',
                                    obj:'students',
                                    tblIndex:1,
                                },
                                {
                                    name:'Student Number',
                                    label:'Student Number',
                                    obj:'students',
                                    tblIndex:0,
                                },
                                {
                                    name:'Class Name',
                                    label:'Class',
                                    obj:'classes',
                                    tblIndex:3,
                                },
                                {
                                    name:'LMS ID',
                                    label:'LMS ID',
                                    obj:'classes',
                                    tblIndex:2,
                                },
                                {
                                    name:'Date',
                                    label:'Date',
                                    obj:'dates',
                                    tblIndex:4,
                                },
                                {
                                    name:'Attendance',
                                    label:'Attendance',
                                    notAllowColumns:true,
                                    disableAsColumns:true,
                                    tblIndex:5,
                                },{
                                    name:'Absent',
                                    label:'Absent',
                                    notAllowColumns:true,
                                    disableAsColumns:true,
                                    tblIndex:6,
                                },{
                                    name:'Reason',
                                    label:'Reason',
                                    notAllowColumns:true,
                                    disableAsColumns:true,
                                    tblIndex:7,
                                },{
                                    name:'Synced on',
                                    label:'Synced on',
                                    notAllowColumns:true,
                                    disableAsColumns:true,
                                    tblIndex:8,
                                },{
                                    name:'Modified on',
                                    label:'Modified on',
                                    obj:'modified',
                                    notAllowColumns:true,
                                    disableAsColumns:true,
                                    tblIndex:9,
                                }
                                ,{
                                    name:'Approved',
                                    label:'Approved',
                                    notAllowColumns:true,
                                    disableAsColumns:true,
                                    tblIndex:9,
                                }
                            ]
                        }
                        function toggleAvailableColumn(colName,remove){
                            if(remove){
                                var col = _.findWhere($scope.config.export.selectedColumns,{name:colName});
                                if(col){
                                    var index = $scope.config.export.selectedColumns.indexOf(col);
                                    $scope.config.export.selectedColumns.splice(index,1);
                                    $scope.config.export.availableColumns.push(col);
                                }
                            }else{
                                var col = _.findWhere($scope.config.export.availableColumns,{name:colName});
                                if(col){
                                    var index = $scope.config.export.availableColumns.indexOf(col);
                                    $scope.config.export.availableColumns.splice(index,1);
                                    $scope.config.export.selectedColumns.push(col);
                                }
                            }
                        }
                        function checkAsColumns(col){
                            var newValue = col.asColumns;
                            col.disableAsColumns=false;
                            _.each($scope.config.export.availableColumns,function(c){
                                if(c.name!=col.name && !c.notAllowColumns){
                                    c.asColumns = false;
                                    c.disableAsColumns=newValue;
                                }

                            })
                            _.each($scope.config.export.selectedColumns,function(c){
                                if(c.name!=col.name && !c.notAllowColumns){
                                    c.asColumns = false;
                                    c.disableAsColumns=newValue;
                                }
                            })
                        }
                        function filterLayouts(item){
                            if($scope.config.export.showOnlyMyLayouts){
                                return $scope.$root.me.id == item.userid;
                            }
                            return true;
                        }
                        function getLayouts(){
                            $scope.download.options.layouts = Attendance.layouts();
                            $scope.download.options.layouts.$promise.then(function() {
                                if ($scope.download.options.layouts.length)
                                    $scope.download.options.data.layout = $scope.download.options.layouts[0].id;
                            })
                        }
                        function canSaveLayout(){
                            if(!$scope.selected.editLayout) return true;
                            return  $scope.selected.editLayout.columns &&
                                (   !angular.equals(
                                        $scope.selected.editLayout.columns,
                                        $scope.config.export.selectedColumns
                                    ) ||
                                    $scope.selected.editLayout.name!=$scope.config.export.layoutName ||
                                    $scope.selected.editLayout.timeUnit!=$scope.config.export.timeUnit ||
                                    $scope.selected.editLayout.timeSeparator!=$scope.config.export.timeSeparator ||
                                    !angular.equals($scope.selected.editLayout.dateFormat,$scope.config.export.dateFormat) ||
                                    $scope.selected.editLayout.share!=$scope.config.export.share
                                )
                        }
                        function deleteLayout(){
                            Alerts.warning({
                                title:'Delete Layout',
                                content:'Are you sure you want to delete this layout',
                                textOk:'Ok',
                                textCancel:'Cancel'
                            },function(){
                                Attendance.deleteLayout(
                                    {layoutId:$scope.selected.editLayout.id},
                                    function(ok){
                                        var index = 0;
                                        for(var i = 0;i<$scope.download.options.layouts.length;i++){
                                            if($scope.download.options.layouts[i].id==$scope.selected.editLayout.id){
                                                index = i;
                                                break;
                                            }
                                        }
                                        $scope.download.options.layouts.splice(i,1);
                                        newLayout();
                                    },
                                    function(error){
                                        $scope.config.export.savingError = error.data.error || 'Unexpected error'
                                    }
                                )
                            });
                        }
                        function newLayout(){
                            $scope.selected.editLayout = null;
                            $scope.config.export.selectedColumns = [];
                            $scope.config.export.layoutName='';
                            $scope.config.export.share=false;
                            createAvailableColumnLayout(false,true);
                        }
                        function saveLayout(){
                            $scope.loading.saveLayout=1;
                            var id;
                            if($scope.selected.editLayout){
                                var id = $scope.selected.editLayout.id;
                            }

                            Attendance.saveLayout({
                                id:id,
                                name:$scope.config.export.layoutName,
                                share:$scope.config.export.share,
                                columns:$scope.config.export.selectedColumns,
                                timeUnit:$scope.config.export.timeUnit,
                                timeSeparator:$scope.config.export.timeSeparator,
                                dateFormat:$scope.config.export.dateFormat
                            },function(layout){
                                $scope.loading.saveLayout=0;
                                if($scope.selected.editLayout && $scope.selected.editLayout.id){
                                    for(var i = 0;i<$scope.download.options.layouts.length;i++){
                                        if($scope.download.options.layouts[i].id==$scope.selected.editLayout.id){
                                            $scope.download.options.layouts[i]=layout;
                                        }
                                    }
                                }else{
                                    $scope.download.options.layouts.push(layout);
                                }
                                $scope.selected.editLayout=layout;
                            },function(error){
                                $scope.config.export.savingError = error.data.error || 'Unexpected error'
                                $timeout(function(){
                                    $scope.config.export.savingError=undefined;
                                },2000);
                                $scope.loading.saveLayout=2;
                            });
                        }

                        var urlParams = $location.search();
                        if(urlParams.hasOwnProperty('dates')){
                            var specificDates = angular.fromJson(urlParams.dates);
                            getAndPrepareReport(true,specificDates);
                        }
                        $scope.selectAllSites = function(){
                            $scope.selected.site = {value:'all'}

                        }
                        $scope.config={
                            filteredPending:[],
                            showLayoutCreator:false,
                            export:{
                                availableColumns:[],
                                selectedColumns:[],
                                dateFormat:['Month','Day','Year'],
                                timeUnit:'hours',
                                timeSeparator:'-',
                                showConfig:true
                            },
                            absentReason:{
                                options:[{
                                    label: 'Illness'
                                }, {
                                    label: 'School Approved Break'
                                }, {
                                    label: 'Family Vacation'
                                }, {
                                    label:'Technical Issues'
                                }, {
                                    label: 'Refusal to work'
                                }, {
                                    label: 'Excused'
                                }, {
                                    label: 'Unexcused'
                                }, {
                                    label: 'Appointment',
                                    customHelperText:"Appointment details"
                                }, {
                                    label: 'Other',
                                    customHelperText:"Details"
                                }]
                            },
                            missingReport:{
                                showPhone:true,
                                showHours:false,
                                onlyNotReportedAtAll:false,
                                includeDates:true,
                            },
                            disableAutoPreview:false
                        };
                        $scope.config.advisors={
                            valueField: 'id',
                            labelField: 'name'
                        };
                        $scope.config.classes={
                            valueField: 'id',
                            labelField: 'name'
                        };
                        $scope.exportTypes = [
                            {
                                text:'Approved only',
                                id:'approved'
                            }
                        ]
                        $scope.download={
                            options:{
                                httpMethod:'POST',
                                data:{
                                    layout:'default',
                                    startdate:moment().format('YYYY-MM-DD'),
                                    enddate:moment().format('YYYY-MM-DD'),
                                    classId:null,
                                    exportType : $scope.exportTypes[0]
                                },
                                layouts:[]
                            }
                        };

                        $scope.selected={
                            type:'week',
                            date:new Date(),
                            startDate:new Date(),
                            endDate:new Date(),
                            filter:'site',
                            filteredStudents:[],
                        };
                        Datepicker.changeDate($scope.selected.date);
                        $scope.maxStudentListHeight = Math.max($(window).height()-130,200);
                    }

                }
            }
        ]).filter('filterByName', function($filter) {
            return function (items, field, reverse) {
                var filtered = [];
                angular.forEach(items, function (item) {
                    filtered.push(item);
                });
                if (!field) return reverse ? filtered.reverse() : filtered;
                return $filter('filter')(filtered, function (item) {
                    var regexp = new RegExp('.*' + field + '.*','i');
                    var name = item.name || (item.firstName + ' ' + item.lastName);
                    return regexp.test(name);
                });
            }
        }).filter('startFrom', function() {
            return function(input, start) {
                start = +start; //parse to int
                if(input)
                    return input.slice(start);
            }
        });
}());





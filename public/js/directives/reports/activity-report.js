
(function(){

    var tables = new Tables();

    angular.module('app')
        .directive('activityReport',
        [ 'UserV2','Report','Class','HelperService','$filter',
            function(UserV2,Report,Class,HelperService,$filter) {
                return {
                    restrict: 'E',
                    scope: {
                        startWithStudent:'=?',
                        startWithClass:'=?',
                        isStudent:'=?'
                    },
                    templateUrl: '/public/views/directives/reports/activity-report.html',
                    link: function ($scope, $element,$attrs) {
                        var datePicker = new DatePicker();

                        function init(){
                            $scope.amIAdmin = $scope.$root.amIAdmin;
                            $scope.teachers = $scope.$root.teachers;

                            if(!$scope.$root.me){
                                UserV2.getUser().then(function(me){
                                    $scope.$root.me=me
                                    if($scope.startWithStudent)
                                    {
                                        $scope.students = $scope.$root.me.childrenV2.length?$scope.$root.me.childrenV2:$scope.$root.me.advisees;
                                    }else{
                                        $scope.students = $scope.$root.me.advisees;
                                    }
                                });
                            }else{
                                if($scope.startWithStudent)
                                {
                                    $scope.students = $scope.$root.me.childrenV2.length?$scope.$root.me.childrenV2:$scope.$root.me.advisees;
                                }else{
                                    $scope.students = $scope.$root.me.advisees;
                                }

                            }


                            $scope.group={by:'class'};
                            $scope.loading={};
                            $scope.select={};
                            $scope.selected= {
                                filter:'site'
                            }
                            $scope.timeUnit = new TimeUnits();
                            $scope.datePicker = datePicker;
                            $scope.timeSpentChart = new TimeSpentChart($scope,datePicker);
                            $scope.tables = tables;



                        }

                        //public functions
                        $scope.formatDuration = tables.formatDuration;
                        $scope.dateRangeFilter=datePicker.dateRangeFilter;
                        $scope.getTotalTime=getTotalTime;
                        $scope.studentHasResults=studentHasResults;
                        $scope.exportCsv = exportCsv;
                        $scope.groupByDay = groupByDay;
                        $scope.filterClassesDateRange = filterClassesDateRange;


                        //watchers
                        $scope.$watch('selectedStudent',getReportForUser)
                        $scope.$watch('selected.site',changeSite);
                        $scope.$watch('selected.advisor',changeAdvisor);
                        $scope.$watch('selected.class',changeClass);
                        $scope.$watch('timeUnit.currentUnit',function(){hideAllCharts();groupByDay($scope.classes);$scope.totalTimeSpentInPlatform = getTotalTime();});
                        $scope.$watch('compareDateRanges',function(compare){
                            if(compare)
                                newSecondaryChart();
                            else{
                                clearSecondaryCharts();
                            }
                        });

                        function hideAllCharts(){
                            var charts = getAllCharts();
                            for(var i = 0; i<charts.length;i++){
                                charts.showChart = false;
                            }
                        }
                        function getAllCharts(){
                            return [$scope.timeSpentChart].concat($scope.secondaryCharts);
                        }
                        $scope.$watch('group.by',changeGroupBy)
                        $scope.$watch('amIAdmin',function(amIAdmin){
                            if(!amIAdmin) return;
                            if(amIAdmin() && !$scope.startWithStudent){
                                Report.getSites(function(sites,error){
                                    $scope.select.sites = sites;
                                },$scope.loading);
                                Report.getCoaches(function(coaches,error){
                                    $scope.select.advisors = coaches;
                                },$scope.loading);
                                Report.getClasses(function(classes,error){
                                    $scope.select.classes = classes;
                                },$scope.loading);
                            }
                        });

                        $scope.refreshChart = function(){
                            groupByDay($scope.classes);
                            filterClassesDateRange($scope.classes);
                            $scope.totalTimeSpentInPlatform = getTotalTime();

                        }
                        function studentHasResults(){
                            return $scope.classes && $scope.classes.length  && $scope.totalTimeSpentInPlatform>0 ;
                        }

                        function changeClass(class_){
                            if($scope.selected.filter!='course') return;

                            $scope.selected.site=null;
                            $scope.selected.advisor=null;
                            $scope.students=null;
                            if(!class_) return;
                            if($scope.selected.class !==null && !$scope.students){
                                Class.get({id:$scope.selected.class,includeUsers:1},
                                    function(class_){
                                        $scope.students = class_.users.students;
                                    },
                                    function(error){}
                                )
                            }
                        }
                        function hasFilter(){
                            return $scope.selected.site||$scope.selected.class||$scope.selected.advisor
                        }
                        function changeAdvisor(advisor){
                            if(!$scope.$root.me) return;
                            if($scope.selected.filter!='advisor') return;

                            if(!advisor){
                                if(!hasFilter()){
                                    $scope.students = $scope.$root.me.advisees;
                                }
                            }
                            else{
                                $scope.selected.site=null;
                                $scope.selected.class=null;
                                $scope.students = advisor.students
                            }
                        }
                        function changeSite(site){
                            if(!$scope.$root.me) return;
                            if(!site){
                                if(!hasFilter()){
                                    $scope.advisees = $scope.$root.me.advisees;
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
                                    $scope.students=advisees;
                                }
                                else{
                                    $scope.students = site.students;
                                }
                            }
                        }
                        function changeGroupBy(){
                            if($scope.group.by=='day' && !$scope.days){
                                groupByDay($scope.classes);
                                $scope.totalTimeSpentInPlatform = getTotalTime();
                            }

                        }
                        function groupByDay(classes,secondary,chart){
                            if(!classes) return;
                            chart = chart || $scope.timeSpentChart;
                            datePicker = chart.datePicker;

                            var days = {};

                            _.each(classes,function(class_){
                                _.each(class_.history,function(item,index){
                                    if(item.time_in == null) return;
                                    var day = moment(item.time_in).format("MM/DD/YYYY");

                                    if(!days[day]){
                                        var day2 = moment(item.time_in).format("YYYYMMDD");
                                        days[day]={timestamp:item.time_in,day:day,day2:day2,history:[]};
                                    }
                                    if(datePicker.isDayInRangeFilter(item.time_in))
                                        days[day].history.push(item);
                                })
                            })
                            days= _.filter(_.map(days,function(day){
                                day.totalTimeSpent = getTotalTime(day);
                                return day
                            }),function(day){
                                return day.day != "Invalid date";
                            });
                            chart.groupClassesByDay(days);
                            chart.updateChartData(classes);
                            if(!secondary){
                                $scope.days = days;
                            }
                        }
                        function filterClassesDateRange(classes,datePicker){
                            datePicker = datePicker || $scope.datePicker
                            angular.forEach(classes,function(class_){
                                getTotalTime(class_,undefined,undefined,true);
                                class_.filteredHistory = _.filter(class_.history,function(entry){
                                    return datePicker.isDayInRangeFilter(entry.time_in);
                                })
                            })
                        }
                        function getReportForUser(){
                            if(!$scope.selectedStudent) return;
                            $scope.loading.user = true;
                            $scope.reportWasLoaded = false;
                            $scope.timeSpentChart.classesByDay = null;
                            delete $scope.days;
                            UserV2.getHistory({id:$scope.selectedStudent,class_id:$scope.startWithClass,includeWithdrawn:$scope.selected.includeWithdrawn},
                                function(report){
                                    $scope.reportWasLoaded=true;
                                    $scope.timeSpentChart.clearSelectedBar()
                                    $scope.classes = $filter('orderBy')(report.classes,'name');
                                    $scope.totalTime = report.totalTime;
                                    $scope.blackoutDates = report.blackoutDates
                                    groupByDay($scope.classes);
                                    $scope.totalTimeSpentInPlatform = getTotalTime();
                                    filterClassesDateRange($scope.classes);
                                    $scope.loading.user = false;
                                },
                                function(error){
                                    $scope.loading.user = false;
                                    $scope.error = error;
                                })
                        }
                        function getTotalTime(class_,classes,datePicker,force){
                            var noFilter=false;
                            datePicker = datePicker || $scope.datePicker;
                            if(!datePicker.rangeMin.dt&&!$datePicker.rangeMax.dt) noFilter=true;

                            if(class_){
                                if(noFilter && class_.totalTime) return class_.totalTime;
                                if(!_.isNull(class_.currentTotalTime) && !_.isUndefined(class_.currentTotalTime) && !force) return class_.currentTotalTime;
                                class_.currentTotalTime = _.reduce(class_.history,function(memo,item){
                                    if(item.timeSpent && datePicker.dateRangeFilter(item))
                                        return memo+item.timeSpent;
                                    return memo;
                                },0);
                                return class_.currentTotalTime
                            }
                            else{
                                classes = classes || $scope.classes;
                                if(noFilter) return $scope.totalTime;
                                return _.reduce(classes,function(memo,class_){
                                    return memo + getTotalTime(class_,classes,datePicker);
                                },0)
                            }
                        }
                        function exportCsv(){

                            var exporter = new Exporter($scope);
                            Report.export.activity({
                                'options': exporter.options,
                                'report': exporter.report,
                                'filename':getStudentName()
                            },function(resp){
                                HelperService.buildFileFromData(resp.content,resp.filename);
                            })
                        }
                        function getStudentName(){
                            var student = _.findWhere($scope.students,{id:$scope.selectedStudent});
                            if(student)
                                return student.lastName+', ' + student.firstName;
                        }

                        function newSecondaryChart(){
                            if(!$scope.secondaryCharts)
                                $scope.secondaryCharts = [];
                            var datePicker = new DatePicker(),
                                chart = new TimeSpentChart($scope,datePicker);
                            $scope.secondaryCharts.push(chart);
                        }
                        function clearSecondaryCharts(){
                            $scope.secondaryCharts = [];
                        }
                        function removeChart(){

                        }
                        init();
                        if($scope.startWithStudent){
                            $scope.selectedStudent = $scope.startWithStudent.id
                        }
                    }

                }
            }
        ]).
        controller('SecondaryChartController',['$scope',function($scope){
            var secondaryClasses = angular.copy($scope.classes);
            $scope.secondaryClasses = secondaryClasses;

            $scope.previousTimeChannel = function(){
                var currentRange = currentRangeDatesInDays();
                $scope.datePicker.rangeMax.dt = moment($scope.datePicker.rangeMin.dt).toDate();
                var maxDate = moment($scope.datePicker.rangeMax.dt);
                $scope.datePicker.rangeMin.dt = maxDate.subtract(currentRange,'days').toDate();
                clearSelectedBarPanels()
            }
            $scope.nextTimeChannel = function(){
                var currentRange = currentRangeDatesInDays();
                $scope.datePicker.rangeMin.dt = moment($scope.datePicker.rangeMax.dt).toDate();
                var minDate = moment($scope.datePicker.rangeMin.dt);
                $scope.datePicker.rangeMax.dt = minDate.add(currentRange,'days').toDate();
                clearSelectedBarPanels()
            }

            $scope.refreshChart = function(){
                $scope.groupByDay(secondaryClasses,true,$scope.chart);
                _.each(secondaryClasses,function(c){delete c.currentTotalTime});
                $scope.chart.totalTimeSpentInPlatform = $scope.getTotalTime(null,secondaryClasses,$scope.chart.datePicker)
            }
            function currentRangeDatesInDays(){
                var minDate = moment($scope.datePicker.rangeMin.dt),
                    maxDate = moment($scope.datePicker.rangeMax.dt)
                return maxDate.diff(minDate, 'days');
            }

            function clearSelectedBarPanels(){
                $scope.chart.currentSelectedBar = {}
                $scope.timeSpentChart.currentSelectedBar = {}
            }
            $scope.$watch('timeUnit.currentUnit',function(newValue,oldValue){
                if(newValue==oldValue) return;
                $scope.groupByDay(secondaryClasses,true,$scope.chart);
                $scope.chart.totalTimeSpentInPlatform = $scope.getTotalTime(null,secondaryClasses,$scope.chart.datePicker)
            });


        }]);
    function Exporter(scope){
        var self = this;
        function getOptions(){
            return {
                groupBy:scope.group.by
            }
        }
        function prepareReportData(){
            return scope.group.by=='class'?reportDataForClasses():reportDataForDays()
        }
        function reportDataForClasses(){
            self.groupBy = 'class'
            return _.map(scope.classes,function(class_){
                return {
                    name:class_.name,
                    rows: _.map(class_.filteredHistory,mapHistory)
                }
            })

        }
        function reportDataForDays(){
            self.groupBy = 'day'
            return _.map(_.filter(scope.days,function(day){
                return scope.datePicker.isDayInRangeFilter(day.timestamp);
            }),function(day){
                return {
                    day:day.day,
                    rows: _.map(day.history,mapHistory)
                }
            })
        }
        function mapHistory(entry){
            var mapped = {
                unit:entry.unitPosition,
                pageName:entry.name,
                time:scope.tables.formatDate(entry.time_in),
                event:scope.tables.getType(entry.type),
                duration:scope.timeUnit.transformUnit(entry.timeSpent),
                timeUnit:scope.timeUnit.currentUnit
            };
            if(self.groupBy=='day'){
                mapped.className = entry.classname;
            }
            return mapped
        }

        return {
            options:getOptions(),
            report:prepareReportData()
        }

    }
    function DatePicker(){
        var self = this;

        function init(){
            var today = new Date();
            self.rangeMin={dt:today.setDate(today.getDate() - 7),opened:false};
            self.rangeMax={dt:new Date(),opened:false};
            self.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };
            self.format = 'MM/dd/yyyy';
        }


        this.today = function(type) {
            self[type].dt = new Date();
        };

        this.clear = function (type) {
            if(type=='max') {
                self.rangeMax = null;
            }else{
                self.rangeMin = null;
            }
        };
        // Disable weekend selection
        this.disabled = function(date, mode) {
            return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
        };
        this.open = function($event,type) {
            $event.preventDefault();
            $event.stopPropagation();

            self[type].opened = true;
        };

        this.dateRangeFilter = function( item ) {
            return self.isDayInRangeFilter(item.time_in);
        }
        this.isDayInRangeFilter = function( timestamp ) {

            var ok = true;
            var timeStampDate = moment(moment(timestamp).format('YYYY-MM-DD')).unix();
            if(self.rangeMin.dt){

                ok = ok && timeStampDate >= moment(moment(self.rangeMin.dt).format('YYYY-MM-DD')).unix();
            }
            if(self.rangeMax.dt){
                ok = ok && timeStampDate <= moment(moment(self.rangeMax.dt).format('YYYY-MM-DD')).unix();
            }
            return ok;
        }
        init();
    };
    function TimeUnits(){
        if (TimeUnits.prototype._singletonInstance) {
            return TimeUnits.prototype._singletonInstance;
        }
        TimeUnits.prototype._singletonInstance = this;

        var self = this;

        this._availableUnits = {
            seconds:'seconds',
            minutes:'minutes',
            hours:'hours',
        }
        this._unitInSeconds = {
            seconds:1,
            minutes:60,
            hours:3600
        }
        this.currentUnit = this._availableUnits.minutes;
        this.transformUnit = function (timeToConvert,decimalPlaces){
            decimalPlaces=self.currentUnit==self._availableUnits.hours?decimalPlaces||2:0;
            return parseFloat((timeToConvert/self._unitInSeconds[self.currentUnit]).toFixed(decimalPlaces));
        }

    };
    function TimeSpentChart(scope,DatePicker){
        var self = this;

        function init(){
            self.datePicker = DatePicker;
            self.timeUnits = TimeUnits();
            self.timeSpentPerDay = [];
            self.classesByDay = null;
            self.showChart = true;
            self.labels =[];
            self.currentSelectedBar = {}
            self.options = {
                barStrokeWidth: 1,
                tooltipHideZero: true
            }
            self.colours = ["#254061", "#376091", "#95B3D7", "#A5A5A5", "#7F7F7F", "#4F6228", "#75923C", "#C2D69A", "#D7E4BC", "#C5BE97", "#948B54"]
        }

        this.isLoaded = function(){
            return self.classesByDay != null && self.labels.length && self.showChart
        }

        this.groupClassesByDay = function(allDaysHistory){
            var classesByDay = {}
            _.each(allDaysHistory,function(day){
                classesByDay[day.day] = {
                    classes:[],
                    totalTimeSpent:day.totalTimeSpent,
                    timestamp:day.timestamp
                };
                var classes = _.groupBy(day.history,'classname');
                _.each(classes,function(classHistory,className){
                    classesByDay[day.day].classes.push(createTimeSpentClassEntry(classHistory,className));
                });
            })
            if(!angular.equals(classesByDay,{}))
                self.classesByDay = classesByDay;

        };

        this.updateChartData = function(classes){
            self.labels =[]
            self.timeSpentPerDay = [];
            if(!self.classesByDay) return;
            var daysInDateRange = getDaysInDateRange()
            _.each(daysInDateRange,addDayLabel);
            orderChartData();
            _.each(classes,addChartDatasetValues);
            clearAllChartsScale();
            self.currentSelectedBar = {}
            refreshChart()

        }
        function addDayLabel(dayString){
            self.labels.push(dayString);
        }
        function addChartDatasetValues(class_){
            var timeSpentPerDayInClass = _.map(self.labels,function(dayString){
                var dayHistory =self.classesByDay[dayString];
                if(dayHistory){
                    return self.timeUnits.transformUnit(timeSpentInAClassDay(dayHistory,class_))
                }
                else{
                    return 0;
                }
            })
            self.timeSpentPerDay.push(timeSpentPerDayInClass);
        }
        function timeSpentInAClassDay(dayHistory,class_){
            var classIndex = _.findIndex(dayHistory.classes,function(c){ return c.className == class_.name});
            if(classIndex>=0){
                return dayHistory.classes[classIndex].timeSpent
            }
            else{
                return 0;
            }
        }
        function getDaysInDateRange(){
            var initialDate = new Date(self.datePicker.rangeMin.dt);
            var finalDate = new Date(self.datePicker.rangeMax.dt);
            var days = [];
            var currentDate = initialDate
            while(currentDate<=finalDate){
                days.push(moment(currentDate).format("MM/DD/YYYY"));
                currentDate.setDate(currentDate.getDate()+1)
            }

            return days;
        }
        function clearAllChartsScale(){
            var allChartsList = [scope.timeSpentChart].concat(scope.secondaryCharts);
            for(var i = 0;i<allChartsList.length;i++){
                allChartsList[i].clearPreviousScaleOptions()
            }
        }
        function updateVisibleChartsScale(){
            if(self.options.scaleOverride) return
            var allChartsList = [scope.timeSpentChart].concat(scope.secondaryCharts);
            allChartsList = _.filter(allChartsList,function(c){return c.chartObj});
            if(allChartsList.length>1 && allChartsList.some(function(c){return c.getChartMaxScale()>1})){
                var maxScaleChart = findMaxScaleChart(allChartsList);
                if(maxScaleChart)
                    setHardCodedScaleToAllCharts(allChartsList,maxScaleChart)
            }
        }
        function findMaxScaleChart(allChartsList){
            var maxScaleChart
            for(var i = 0;i<allChartsList.length;i++){
                var chart = allChartsList[i];
                if(!maxScaleChart || (chart.getChartMaxScale() > maxScaleChart.getChartMaxScale())){
                    maxScaleChart = chart;
                }
            }
            return maxScaleChart;
        }
        function setHardCodedScaleToAllCharts(allChartsList,maxScaleChart){
            for(var i = 0;i<allChartsList.length;i++) {
                var chart = allChartsList[i];
                chart.options.scaleOverride = true
                chart.options.scaleSteps = maxScaleChart.chartObj.scale.steps
                chart.options.scaleStepWidth = maxScaleChart.chartObj.scale.stepValue
                chart.refreshChart()
            }
        }
        this.getChartMaxScale = function(){
            if(!self.chartObj) return 0;
            return self.chartObj.scale.max
        }
        this.clearPreviousScaleOptions = function(){
            delete self.options.scaleOverride;
            delete self.options.scaleSteps;
            delete self.options.scaleStepWidth;
        }

        this.clearSelectedBar = function(){
            self.currentSelectedBar ={}
        }
        this.barWasClicked = function(bar,evt,chart){
            self.currentSelectedBar ={
                classes:self.classesByDay[bar[0].label].classes,
                label: bar[0].label,
                totalTimeSpent:totalTimeForBar(self.classesByDay[bar[0].label].classes)
            }
        }
        function totalTimeForBar(classes){
            var total = 0;
            for(var i = 0;i<classes.length;i++){
                total+=classes[i].timeSpent
            }
            return total;
        }
        this.textCurrentBarTotalTime = function(){
            if(!self.currentSelectedBar) return;
            return self.timeUnits.transformUnit(self.currentSelectedBar.totalTimeSpent) + ' ' + self.timeUnits.currentUnit;
        }

        function createTimeSpentClassEntry(classHistory,className){
            return {
                timeSpent:reduceTimeSpentPerClass(classHistory),
                className:className
            }
        }
        function reduceTimeSpentPerClass(classHistory) {
            return _.reduce(classHistory, function (memo, item) {
                if (item.timeSpent && self.datePicker.dateRangeFilter(item))
                    return memo + item.timeSpent;
                return memo;
            }, 0)
        }
        function refreshChart(){
            self.showChart = false;
            setTimeout(function(){
                self.showChart = true
                scope.$apply()
            },100    );
        }
        this.refreshChart = refreshChart;


        function labelToDate(label){
            var compenents = label.split('/');
            return new Date(compenents[2]+'-'+compenents[0]+'-'+compenents[1]);
        }
        function orderChartData(){
            var len = self.labels.length;
            for (var i = len-1; i>=0; i--){
                for(var j = 1; j<=i; j++){
                    var date1 = self.labels[j-1].split
                    if(labelToDate(self.labels[j-1])>labelToDate(self.labels[j])){
                        var tempLabel = self.labels[j-1];
                        var tempTimeSpent = self.timeSpentPerDay[j-1];

                        self.labels[j-1] = self.labels[j];
                        self.timeSpentPerDay[j-1] = self.timeSpentPerDay[j];

                        self.labels[j] = tempLabel;
                        self.timeSpentPerDay[j] = tempTimeSpent;
                    }
                }
            }
        }
        scope.$on('create',function(e,chart){
            self.classColours = _.map(chart.datasets,function(dataset){
                return dataset.fillColor;
            })
            self.chartObj = chart;
            updateVisibleChartsScale()
        });
        init();
    };
    function Tables(){
        var timeUnits = new TimeUnits()
        function formatDate(time){
            return moment(time).format("MM/DD/YYYY hh:mm:ss");
        }
        function formatDuration(duration,format){
            if(!duration) return 'N/A';
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
        }
        function getType(type){
            switch(type) {
                case 'quiz':
                    return 'Submitted'
                    break;
                case 'history':
                    return 'Entered'
                    break;
                case 'post':
                    return 'Posted'
                    break;
                case 'grade':
                    return 'Grade Received'
                    break;
                default:
                    return ''
            }
        }
        function timeSpentText(data){
            return timeUnits.transformUnit(data.timeSpent) + ' ' + timeUnits.currentUnit;
        }

        return {
            tableHeader1:[
                {id:'unitPosition',label:'Unit'},
                {id:'name',label:'Page Name'},
                {id:'time_in',label:'Time',functions:{'formatDate':formatDate},rowTemplate:'{{functions.formatDate(data.time_in)}}'},
                {id:'type',label:'Event',functions:{'getType':getType},rowTemplate:'{{functions.getType(data.type)}}'},
                {id:'timeSpent',label:'Duration',functions:{'formatDuration':formatDuration},rowTemplate:'{{functions.formatDuration(data.timeSpent)}}'}
            ],
            tableHeader2:[
                {id:'classname',label:'Class'},
                {id:'unitPosition',label:'Unit'},
                {id:'name',label:'Page Name'},
                {id:'time_in',label:'Time',functions:{'formatDate':formatDate},rowTemplate:'{{functions.formatDate(data.time_in)}}'},
                {id:'type',label:'Event',functions:{'getType':getType},rowTemplate:'{{functions.getType(data.type)}}'},
                {id:'timeSpent',label:'Duration',functions:{'formatDuration':formatDuration},rowTemplate:'{{functions.formatDuration(data.timeSpent)}}'}
            ],
            classesPerDayHeader:[
                {'id':'className',label:'Class Name'},
                {'id':'timeSpent',label:'Time Spent',functions:{timeSpentText:timeSpentText},rowTemplate:'{{functions.timeSpentText(data)}}'}

            ],
            formatDuration:formatDuration,
            formatDate:formatDate,
            getType:getType,
            timeSpentText:timeSpentText
        }

    }
    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

}());

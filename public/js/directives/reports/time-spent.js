angular.module('app')

    /*
     * All current students report
     * */

    .directive('timeSpent',
    [ '$q','UserV2','Report','OrganizationV2',
        function($q,UserV2,Report,OrganizationV2) {
            return {
                restrict: 'E',
                scope: {

                },
                templateUrl: '/public/views/directives/reports/time-spent.html',
                link: function ($scope, $element,$attrs) {
                    if(!$scope.$root.me){
                        UserV2.getUser().then(function(me){$scope.$root.me=me});
                    }
                    var original;

                    $scope.amIAdmin = $scope.$root.amIAdmin;
                    $scope.teachers = $scope.$root.teachers;
                    $scope.isTeacher=isTeacher;
                    $scope.timeSpentText=timeSpentText
                    $scope.selectPage=selectPage;
                    $scope.filterMinimumTime=filterMinimumTime
                    $scope.onClick=onClick;

                    $scope.$watch('class.selected',getClass);
                    $scope.$watch('config.labels',groupData);
                    $scope.$watch('config.unit',function(){selectPage()});
                    $scope.$watch('selected.teacher',changeTeacher);

                    $scope.$root.$watch('me',function(){
                        if($scope.amIAdmin()){
                            if(!$scope.$root.allClasses){
                                OrganizationV2.getClasses({id:$scope.$root.me.orgId}).$promise.then(function(classes){
                                    $scope.$root.allClasses = classes;
                                    changeTeacher()
                                });

                            }
                        }else{
                            $scope.classes=addAllLabel(prepareClasses($scope.$root.me.classes))
                        }
                    });
                    $scope.class={};
                    $scope.config={};
                    $scope.report={};
                    $scope.selected={};

                    resetDefault();


                    function isTeacher(c){
                        return $scope.amIAdmin()||c.isTeacher;
                    }
                    function changeTeacher(teacher){
                        if(teacher){
                            var classes = []
                            _.each(teacher.classes,function(c){
                                if(c.is_teacher==1){

                                    classes.push(c);
                                }

                            })
                            $scope.classes=addAllLabel(prepareClasses(classes));
                        }else

                            $scope.classes=addAllLabel(prepareClasses($scope.$root.allClasses));
                    }
                    function prepareClasses(classes){

                        _.each(classes,function(c){
                            if((c.id+'').indexOf('-')<0){
                                c.id = c.groupId?c.id+'-'+c.groupId:c.id;
                            }
                        });
                        return classes;
                    }
                    function addAllLabel(classes){
                        if(!classes) return classes;
                        var cs = angular.copy(classes);
                        cs.unshift({
                            id:'all',
                            name:"-All",
                            isTeacher:true
                        });
                        return cs;
                    }
                    function getClass(){

                        if(!$scope.class.selected) return;
                        $scope.loading=true;
                        delete $scope.report;
                        var promise = Report.retrieve('time-spent/'+$scope.class.selected);
                        promise.then(
                            function(resp){
                                original = angular.copy(resp);
                                $scope.loading=false;

                                $scope.report={pages:resp};
                                groupData();
                                selectPage('all');

                            },
                            function(error){
                                $scope.error =error.error;
                                $scope.loading=false;
                            }
                        );
                        
                    }
                    function filterMinimumTime(){
                        var minimumTime=parseFloat($scope.config.minimumTime)*$scope.config.units[$scope.config.unit];
                        minimumTime=isNaN(minimumTime)?0:minimumTime;
                        var pages = angular.copy(original);
                        pages = _.filter(pages,function(p){
                            p.avgTimeSpent=0
                            p.min=null
                            p.max=null;
                            p.students= _.filter(p.students,function(s){
                                if(s.timeSpent>=minimumTime){
                                    p.avgTimeSpent+= s.timeSpent;
                                    if(p.min===null|| s.timeSpent<p.min) p.min= s.timeSpent
                                    if(p.max===null|| s.timeSpent>p.max) p.max= s.timeSpent;
                                }
                                return s.timeSpent>=minimumTime
                            })
                            p.avgTimeSpent=p.avgTimeSpent/ p.students.length;
                            return p.students.length;
                        });
                        $scope.report.pages=pages;
                        groupData();
                        var currentPage;
                        if($scope.selected.pageId=='all')
                            currentPage='all';
                        else{
                            currentPage= _.find(pages,function(p){return p.id=$scope.selected.pageId});
                        }
                        selectPage(currentPage);
                    }
                    function onClick(group, evt) {

                        $scope.selectedGroup={
                            label:group[0].label,
                            students:$scope.groupedData[group[0].label]
                        }
                    }
                    function selectPage(page){

                        delete $scope.selectedGroup;
                        if(page=='all'){
                            page=$scope.report;
                            $scope.selected.pageId='all'
                            $scope.selected.page=$scope.report;
                        }else{
                            if(page){
                                $scope.selected.pageId=page.id
                                $scope.selected.page=page
                            }else{
                                page=$scope.selected.page
                            }
                        }
                        if(!page) return;
                        calculateLabels(page.min,page.max,5);
                        var groupedData = {};

                        _.each($scope.config.labels,function(l){groupedData[l]=[]});

                        _.each(page.students,function(s){
                            var timeSpent =transformUnit(s.timeSpent);
                            var label = _.find($scope.config.labelConditions,function(l){
                               var ge = eval(timeSpent+ l.ge)
                               var lt = l.lt?eval(timeSpent+ l.lt):true;
                               return ge && lt;
                            });
                            groupedData[label.text].push(s);
                        });
                        $scope.config.data=[];
                        for(var i=0;i<$scope.config.labels.length;i++){
                            $scope.config.data.push(groupedData[$scope.config.labels[i]].length);
                        }
                        $scope.config.data=[$scope.config.data];
                        $scope.groupedData=groupedData;
                    }
                    function groupData(){
                        if(!$scope.report) return;

                        var students = {},
                            min=null,
                            max=null;
                        var total=0;
                        _.each($scope.report.pages,function(page){
                            _.each(page.students,function(s){
                                if(!students[s.id])
                                    students[s.id]=angular.copy(s);
                                else
                                    students[s.id].timeSpent+= s.timeSpent;
                                if(min===null|| s.timeSpent<min) min= s.timeSpent
                                if(max===null|| s.timeSpent>max) max= s.timeSpent;
                                total+= s.timeSpent;
                            });
                        });
                        $scope.report.students = students;
                        $scope.report.max = max;
                        $scope.report.min = min;
                        $scope.report.avgTimeSpent=total/ _.map(students,function(s){return s}).length
                    }
                    function transformUnit(val,r){
                        r=$scope.config.unit=='hours'?r||0:0

                        return parseFloat((val/$scope.config.units[$scope.config.unit]).toFixed(r));
                    }
                    function calculateLabels(min,max,n){
                        $scope.config.unit=$scope.config.unit||'minutes';
                        max=transformUnit(max);
                        min=transformUnit(min);
                        var step=Math.round((max-min)/n);
                        $scope.config.labels=[];
                        $scope.config.labelConditions=[];
                        while(min<=max){
                            var next = Math.min(min+step,max+1);
                            var text;
                            if(next<max){
                                text = min + ' - ' + next;
                                $scope.config.labelConditions.push({
                                    ge:'>='+min,
                                    lt:'<'+next,
                                    text:text
                                })
                            }else{
                                text = '> ' + min;
                                $scope.config.labelConditions.push({
                                    ge:'>='+min,
                                    text:text
                                })
                            }
                            $scope.config.labels.push(text);
                            min=next;
                            if(step==0) break;
                        }
                    }
                    function timeSpentText(data,avg){
                        if(!data) return;
                        var t = avg?transformUnit(data.avgTimeSpent,1):transformUnit(data.timeSpent,1)
                        return t + ' ' + $scope.config.unit;
                    }
                    function resetDefault(){
                        $scope.config.studentTableHeader=[
                            {'id':'last_name',label:'Student',rowTemplate:'{{data.last_name}}, {{data.first_name}}'},
                            {'id':'timeSpent',label:'Time Spent',functions:{timeSpentText:timeSpentText},rowTemplate:'{{functions.timeSpentText(data)}}'}

                        ];
                        $scope.config.units={
                            'seconds':1,
                            'minutes':60,
                            'hours':3600,
                        }
                        $scope.selected.pageId='all'
                        $scope.config.minimumTimeHelper = 'Once you set the minimum time, it will ignore all student activities that took less than the minimum time specified. Please note that the minimum time uses the current unit selected. For example: If you selected minutes as the preferred unit and type a 1, all activities that took less than a minute will be ignored.'
                    }

                }
            }
        }
    ]);


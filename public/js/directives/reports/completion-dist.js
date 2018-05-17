angular.module('app')

    /*
     * All current students report
     * */

    .directive('completionDist',
    [ '$q','UserV2','Gradebook','Class',
        function($q,UserV2,Gradebook,Class) {
            return {
                restrict: 'E',
                scope: {

                },
                templateUrl: '/public/views/directives/reports/completion-dist.html',
                link: function ($scope, $element,$attrs) {
                    if(!$scope.$root.me){
                        UserV2.getUser().then(function(me){$scope.$root.me=me});
                    }
                    $scope.isTeacher=isTeacher;
                    $scope.onClick=onClick;

                    $scope.$watch('class.selected',getClass);
                    $scope.$watch('config.labels',groupProgress);
                    $scope.$root.$watch('selected.teacher',changeTeacher)

                    $scope.$root.$watch('me',function(){
                        if($scope.amIAdmin()){
                            if(!$scope.$root.allClasses){
                                $scope.$root.allClasses = OrganizationV2.getClasses({id:$scope.$root.me.orgId});
                                changeTeacher();
                            }
                        }else{
                            $scope.classes=$scope.$root.me.classes
                        }
                    });
                    $scope.class={}
                    $scope.config={};
                    $scope.report={};
                    $scope.selected={};
                    $scope.amIAdmin = $scope.$root.amIAdmin;


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
                            $scope.classes=classes;
                        }else
                            $scope.classes=$scope.$root.allClasses;
                    }
                    function getClass(){
                        if(!$scope.class.selected) return;

                        var query = {
                            'gradebook':Gradebook.getCachedClassGrades({classId:$scope.class.selected}).$promise,
                            'class':Class.get({id:$scope.class.selected})
                        }
                        delete $scope.report;
                        $scope.report={}
                        $scope.loading = true
                        $q.all(query).then(
                            function(resp){
                                $scope.loading=false;
                                $scope.report.gradebook=resp.gradebook;
                                $scope.report.classInfo=resp.class;
                                groupProgress($scope.config.labels);

                            },
                            function(error){
                                $scope.error =error.error;
                                $scope.loading=false;
                            }
                        )
                    }
                    function onClick(group, evt) {

                        $scope.selectedGroup={
                            label:group[0].label,
                            students:$scope.groupedProgress[group[0].label]
                        }
                    }
                    
                    function groupProgress(labels,students){
                        if(!labels||!$scope.report.gradebook) return;
                        var groupedProgress = {};
                        _.each(labels,function(l){groupedProgress[l]=[]});
                        students=students||$scope.report.gradebook.students
                        _.each(students,function(student){
                            //'90 days','91-120 days','121-150 days','151-180 days','> 180 days'
                            var completionTime=getCompletionTime(student);
                            student.completionTime=completionTime;

                            if(completionTime<=90)
                                groupedProgress['90 days'].push(student);

                            else if(completionTime<=120 && completionTime>90)
                                groupedProgress['91-120 days'].push(student);

                            else if(completionTime<=150 && completionTime>121)
                                groupedProgress['121-150 days'].push(student);

                            else if(completionTime<=180 && completionTime>150)
                                groupedProgress['151-180 days'].push(student);

                            else
                                groupedProgress['> 180 days'].push(student);


                        })

                        $scope.config.data=[];
                        for(var i=0;i<labels.length;i++){
                            $scope.config.data.push(groupedProgress[labels[i]].length);
                        }
                        $scope.config.data=[$scope.config.data];
                        $scope.groupedProgress=groupedProgress;
                        $scope.report.gradebook.avg_progress= calculateAvgProgress(students);
                    }
                    function calculateAvgProgress(students){
                        return parseInt(_.reduce(students,function(memo,s){
                                return s.completionTime?memo+ s.completionTime:memo
                            },0)/ (_.filter(students,function(s){return s.completionTime}).length));
                    }
                    function getCompletionTime(data){
                        if(!data.projectedEndDate) return;
                        var firstDate = (new Date()).getTime();
                        var projectedEndDate = (new Date(data.projectedEndDate)).getTime();
                        var msDay = 60*60*24*1000;
                        return Math.floor((projectedEndDate - firstDate) / msDay);
                    }
                    function formatCompletionText(data){
                        return data.completionTime?data.completionTime+' days':'N/A';
                    }
                    function resetDefault(){
                        $scope.config.studentTableHeader=[
                            {'id':'lastName',label:'Student',rowTemplate:'{{data.lastName}}, {{data.firstName}}'},
                            {'id':'completionTime',label:'Projected completion time',functions:{formatCompletionText:formatCompletionText},rowTemplate:'{{functions.formatCompletionText(data)}}'}
                        ];
                        $scope.config.labels=[
                            '90 days','91-120 days','121-150 days','151-180 days','> 180 days'
                        ];

                        $scope.selected.pageId='all'

                    }

                }
            }
        }
    ]);


angular.module('app')

    /*
     * All current students report
     * */

    .directive('resubmissions',
    [ '$q','UserV2','PostV2','OrganizationV2',
        function($q,UserV2,PostV2,OrganizationV2) {
            return {
                restrict: 'E',
                scope: {

                },
                templateUrl: '/public/views/directives/reports/resubmissions.html',
                link: function ($scope, $element,$attrs) {
                    if(!$scope.$root.me){
                        UserV2.getUser().then(function(me){$scope.$root.me=me});
                    }
                    $scope.isTeacher=isTeacher;
                    $scope.onClick=onClick;
                    $scope.selectAssignment=selectAssignment;

                    $scope.$watch('selected.class',getClass);
                    $scope.$watch('config.labels',groupData);
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

                    
                    $scope.config={};
                    $scope.selected={};
                    $scope.report={}
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
                        if(!$scope.selected.class) return;
                        $scope.loading=true;
                        $scope.report={};
                        PostV2.resubmissions({id:$scope.selected.class.id},
                            function(resp){
                                $scope.loading=false;
                                $scope.report = resp
                                groupData($scope.config.labels);

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
                            students:$scope.groupedData[group[0].label]
                        }
                    }
                    function getAllPosts(){
                        if($scope.report.students) return $scope.report.students;

                        var students = {};
                        var total = 0;
                        var resubmissions=0;
                        _.each($scope.report.pages,function(p){
                            _.each(p.students,function(s){
                                total+=s.submissions;
                                resubmissions+=s.submissions-1;
                                if(!students[s.id]){
                                    students[s.id]=angular.copy(s);
                                    students[s.id].pageCount=1
                                    students[s.id].submissions_per_page=s.submissions;
                                }

                                else{
                                    students[s.id].submissions_per_page+=s.submissions;
                                    students[s.id].pageCount++
                                }

                            })
                        })
                        _.each(students,function(s){
                            students[s.id].submissions=parseFloat((students[s.id].submissions_per_page/students[s.id].pageCount).toFixed(1));
                        })

                        students= _.map(students,function(s){return s});
                        $scope.report.students=students;
                        $scope.report.total=total;
                        $scope.report.resubmissionPercentage=parseInt(resubmissions*100/total);
                        return students;
                    }

                    function groupData(labels,students){
                        if(!labels||!$scope.report.pages) return;
                        var groupedData = {};
                        _.each(labels,function(l){groupedData[l]=[]});

                        students=students||getAllPosts();
                        _.each(students,function(student){
                            //'90 days','91-120 days','121-150 days','151-180 days','> 180 days'
                            var submissions=student.submissions;

                            if(submissions>=1 && submissions<2)
                                groupedData['1-2'].push(student);

                            else if(submissions>=2 && submissions<3)
                                groupedData['2-3'].push(student);

                            else if(submissions>=3 && submissions<4)
                                groupedData['3-4'].push(student);

                            else if(submissions>=4 && submissions<5)
                                groupedData['4-5'].push(student);

                            else
                                groupedData['5+'].push(student);


                        })

                        $scope.config.data=[];
                        for(var i=0;i<labels.length;i++){
                            $scope.config.data.push(groupedData[labels[i]].length);
                        }
                        $scope.config.data=[$scope.config.data];
                        $scope.groupedData=groupedData;
                        if(!$scope.report.avg)
                            $scope.report.avg= calculateAvg(students);
                    }
                    function calculateAvg(students){
                        return parseFloat((_.reduce(students,function(memo,s){
                                return s.submissions?memo+ s.submissions:memo
                            },0)/ students.length).toFixed(1));
                    }
                    function selectAssignment(page){

                        if(page!='all'){
                            $scope.selected.pageId=page.id
                            $scope.selected.page=page;
                            groupData($scope.config.labels,page.students);

                        }else{
                            $scope.selected.pageId='all';
                            delete $scope.selected.page;
                            groupData($scope.config.labels);
                        }
                        if($scope.selectedGroup)
                            $scope.selectedGroup.students=$scope.groupedData[$scope.selectedGroup.label]

                    }

                    function resetDefault(){
                        $scope.config.studentTableHeader=[
                            {'id':'last_name',label:'Student',rowTemplate:'{{data.last_name}}, {{data.first_name}}'},
                            {'id':'submissions',label:'Posts'}
                        ];
                        $scope.config.labels=[
                            '1-2','2-3','3-4','4-5','5+'
                        ];
                        $scope.selected.pageId='all'
                    }

                }
            }
        }
    ]);


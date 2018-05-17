angular.module('app')

    /*
     * All current students report
     * */

    .directive('courseGrades',
    [ '$q','UserV2','Gradebook','Class','ShowDatesGrades','OrganizationV2',
        function($q,UserV2,Gradebook,Class,ShowDatesGrades,OrganizationV2) {
            return {
                restrict: 'E',
                scope: {

                },
                templateUrl: '/public/views/directives/reports/course-grades.html',
                link: function ($scope, $element,$attrs) {
                    if(!$scope.$root.me){
                        UserV2.getUser().then(function(me){$scope.$root.me=me});
                    }
                    $scope.isTeacher=isTeacher;
                    $scope.onClick=onClick;
                    $scope.selectAssignment=selectAssignment;
                    $scope.amIAdmin = $scope.$root.amIAdmin;
                    $scope.teachers = $scope.$root.teachers;
                    $scope.selected = {}

                    $scope.$watch('class.selected',getClass);
                    $scope.$watch('selected.teacher',changeTeacher);
                    $scope.$watch('config.labels',groupGrades);

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
                                groupGrades($scope.config.labels);
                                groupAssignmentGrades();
                                selectAssignment('all');
                                $scope.report.gradebook.avg_grade=calculateAvgGrade(resp.gradebook.students);
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
                            students:$scope.groupedGrades[group[0].label]
                        }
                    };
                    function calculateAvgGrade(students){
                        return parseInt(_.reduce(students,function(memo,s){
                            return memo+ s.percCompletedScore
                        },0)/ (students.length));
                    }

                    function groupGrades(labels,students){
                        if(!labels||!$scope.report.gradebook) return;
                        var groupedGrades = {};
                        _.each(labels,function(l){groupedGrades[l]=[]});
                        students=students||$scope.report.gradebook.students
                        _.each(students,function(student){
                            groupedGrades[student.letterCompletedScore].push(student);
                        })

                        $scope.config.data=[];
                        for(var i=0;i<labels.length;i++){
                            $scope.config.data.push(groupedGrades[labels[i]].length);
                        }
                        $scope.config.data=[$scope.config.data];
                        $scope.groupedGrades=groupedGrades;
                    }
                    function selectAssignment(page){

                        if(page!='all'){
                            $scope.selected.pageId=page.id
                            $scope.selected.page=page;
                            groupGrades($scope.config.labels,page.students);

                        }else{
                            $scope.selected.pageId='all';
                            delete $scope.selected.page;
                            groupGrades($scope.config.labels)
                        }
                        if($scope.selectedGroup)
                            $scope.selectedGroup.students=$scope.groupedGrades[$scope.selectedGroup.label]

                    }

                    function groupAssignmentGrades(){
                        if(!$scope.report.gradebook) return;
                        var pages = {};
                        _.each($scope.report.gradebook.students,function(s){
                            _.each(s.units,function(u){
                                _.each(u.pagegroups,function(pg){
                                    _.each(pg.pages,function(p){
                                        if(!pages[p.id]){
                                            pages[p.id]={

                                                avg_grade:0,
                                                name: p.name,
                                                id:p.id,
                                                students:[]
                                            }
                                        }
                                        if(p.score!=null){


                                            var score = parseFloat(p.score)*100/parseFloat(p.maxScore);
                                            score = isNaN(score)?0:score;
                                            p.letterCompletedScore=ShowDatesGrades.getLetterGrade($scope.report.classInfo.rubric,score);
                                            p.percCompletedScore=Math.round(score,2);
                                            p.firstName= s.firstName
                                            p.lastName= s.lastName;
                                            pages[p.id].avg_grade+=score;
                                            pages[p.id].students.push(p);
                                        }
                                    })
                                })
                            })
                        })
                        $scope.report.gradebook.allAssignments= _.map(pages,function(p,key){
                            var avg = parseInt(p.avg_grade/p.students.length);
                            p.avg_grade= isNaN(avg)?0:avg
                            return p;
                        })
                    }

                    function resetDefault(){
                        $scope.config.studentTableHeader=[
                            {'id':'lastName',label:'Student',rowTemplate:'{{data.lastName}}, {{data.firstName}}'},
                            {'id':'percCompletedScore',label:'Grade',rowTemplate:'{{data.percCompletedScore}}%'}
                        ]
                        $scope.config.labels=[
                            'F','D-','D','D+','C-','C','C+','B-','B','B+','A-','A','A+'
                        ];
                        $scope.selected.pageId='all'

                    }

                }
            }
        }
    ]);


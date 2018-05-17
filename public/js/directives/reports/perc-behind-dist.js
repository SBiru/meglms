angular.module('app')

    /*
     * All current students report
     * */

    .directive('percBehindDist',
    [ 'Report',
        function(Report) {
            return {
                restrict: 'E',
                scope: {

                },
                templateUrl: '/public/views/directives/reports/perc-behind-dist.html',
                link: function ($scope, $element,$attrs) {


                    $scope.labels=['<=20%','Between 20% and 35%','>35%'];
                    $scope.selectClass=selectClass;
                    $scope.formatProgress=formatProgress;


                    $scope.$on('create', chartChanged);
                    $scope.$on('update', chartChanged);
                    $scope.$root.$watch('selected.teacher',changeTeacher)

                    function changeTeacher(teacher){
                        if(teacher){
                            var classes = []
                            _.each(teacher.classes,function(c){
                                if(c.is_teacher==1){
                                    classes.push(c);
                                }

                            })
                            $scope.selectedClasses=classes;
                        }else
                            $scope.selectedClasses=$scope.$root.allClasses;
                        getReport();
                    }

                    getReport();
                    function chartChanged (event, chart) {
                        $scope.chart=chart;
                        $scope.colors=['#72D489','#FF9E28','#F7464A'];
                        $scope.strokes=['#333','#333','#333'];
                        for(var i = 0;i<chart.segments.length;i++){
                            paintPanel(i);
                        }
                    }
                    function paintPanel(i){
                        var panelHeading = angular.element($element.find('.student-tab .panel-heading')[i]);
                        panelHeading.css('color',$scope.strokes[i]);
                        panelHeading.css('background-color',$scope.colors[i]);
                    }
                    function getReport(){
                        $scope.loading = true;
                        var params;
                        if($scope.selectedClasses)
                            params={
                                classes: JSON.stringify(_.map($scope.selectedClasses,function(c){return c.id}))
                            }
                        Report.retrieve('perc-behind-dist',params).then(
                            function(report){
                                $scope.classes = report;
                                $scope.loading = false;
                            },
                            function(error){
                                $scope.loading = false;
                                $scope.error = error;
                            }
                        )
                    }
                    function formatProgress(p){
                        if(p>=0) return p+'%';
                        return Math.abs(p)+'% ahead'
                    }
                    function selectClass(){
                        $scope.class_= _.findWhere($scope.classes,{id:$scope.selectedClass})
                        $scope.data=[
                            $scope.class_.percBehind.lt_20.students.length,
                            $scope.class_.percBehind.gt_20_lt_35.students.length,
                            $scope.class_.percBehind.gt_35.students.length
                        ];
                        $scope.students=[
                            $scope.class_.percBehind.lt_20.students,
                            $scope.class_.percBehind.gt_20_lt_35.students,
                            $scope.class_.percBehind.gt_35.students
                        ]
                    }


                }
            }
        }
    ]);


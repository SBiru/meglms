angular.module('app')

    /*
     * All current students report
     * */

    .directive('gradingQueue',
    [ 'Report','GraderNav',
        function(Report,GraderNav) {
            return {
                restrict: 'E',
                scope: {

                },
                templateUrl: '/public/views/directives/reports/grading-queue.html',
                link: function ($scope) {
                    $scope.loading = {};
                    $scope.selected = {};
                    $scope.amIAdmin = $scope.$root.amIAdmin;
                    $scope.teachers = $scope.$root.teachers;
                    if(!$scope.amIAdmin())
                        $scope.$root.$watch('me',getReport);
                    $scope.$watch('selected.teacher',getReport);

                    $scope.toggleOpenAll = function(){
                        for(var i=0;i<$scope.classes.length;i++){
                            $scope.classes[i].show=$scope.openAll;
                        }
                    };

                    function getReport(me){
                        if(!me) return;
                        var promises={};
                        $scope.classes=me.classes;

                        _.each(me.classes,function(c){
                            $scope.loading[c.id]=true;
                            promises[c.id]=GraderNav.query({courseId: c.courseId}).$promise;
                        });
                        _.each(promises,function(p,key){
                            p.then(
                                function(r){
                                    $scope.loading[key]=false;

                                    var c = _.find($scope.classes,function(c){return c.id==key});
                                    var total = _.reduce(r.units,function(memo,u){
                                        var t = _.reduce(u.pages,function(m,p){
                                            return m+parseInt(p.count_needing_grading);
                                        },0)
                                        return memo+t;
                                    },0);
                                    c.units= r.units;
                                    c.total = total;
                                    c.empty=!c.total;


                                },
                                function(error){
                                    $scope.loading[key]=false;
                                }
                            )
                        })
                    }


                }
            }
        }
    ])

angular.module('app')
    .controller('GradebookModalDurationsController',
    [	'$scope',
        '$modalInstance',
        '$stateParams',
        'params',
        'Class',
        function($scope, $modalInstance, $stateParams, params,Class){
            //private variables
            var original = angular.copy(params.units);
            var classId = $stateParams.classId;

            //public variables
            $scope.units = params.units;

            //public functions
            $scope.cancel = cancel;
            $scope.canSave = canSave;
            $scope.save = save;
            $scope.totalForUnit = totalForUnit;
            $scope.totalForGroup = totalForGroup;

            //functions
            function cancel(){
                $modalInstance.dismiss('cancel');
            }
            function canSave(){
                return !angular.equals(original,$scope.units) || $scope.$root.classInfo.editing;
            }
            function save(){
                var pages = [];
                $scope.saving = 1;
                angular.forEach($scope.units,function(unit){
                    if(!unit) return;
                    angular.forEach(unit.pagegroups,function(group){
                        if(group.id){
                            pages.push({
                                id:group.id,
                                lesson_duration:group.lesson_duration
                            });
                        }
                        angular.forEach(group.pages,function(page){
                            if(page.editing)
                                pages.push(page);
                        })
                    })
                });
                var params = {
                    id:classId,
                    pages:pages
                };
                if($scope.$root.classInfo.editing){
                    params.courseLength=$scope.$root.classInfo.courseLength
                }
                Class.updateDurations(params,
                    function(ok){
                        $scope.saving = 0;
                    },
                    function(error){
                        $scope.saving = 2;
                        $scope.error = error.error;
                    }
                )
            }
            function totalForUnit(unit){
                var total=0;
                angular.forEach(unit.pagegroups,function(group){
                    total+=totalForGroup(group);
                })
                return total;
            }
            function totalForGroup(group){
                var total=0;
                angular.forEach(group.pages,function(page){
                    total+=page.lesson_duration;
                })
                return total;
            }
        }
    ]
);
appControllers.controller('SuperUnitController', ['$rootScope', '$scope', 'SuperUnit','CurrentCourseId',
    function ($rootScope, $scope, SuperUnit,CurrentCourseId) {
        $scope.courseService = CurrentCourseId;
        $scope.superUnit = SuperUnit

        $scope.$watch('courseService.course_id',function(id){
            if(!id) return;
            var classId = CurrentCourseId.data.classId || CurrentCourseId.data.class_id;
            $scope.superUnit.loadSuperUnits(classId);
        });
        $scope.$watch('superUnit.currentUnit',function(unit,oldUnit){
            if(!unit || unit==oldUnit) return;
            $scope.superUnit.changeSuperUnit(unit)

            $rootScope.$broadcast('NavForceReload');

        });
        $scope.$watch('superUnit.units',function(units){
            if(units && units.length<=1){
                $scope.hideFromStudent = true;
            }else{
                if((window.location.href.indexOf('/editor/') === -1)){
                    _.each($scope.superUnit.units,function(u){
                        u.hideUnit = u.hide_from_student;
                    })
                }
                $scope.hideFromStudent = false;
            }
        })
        $scope.showUnit = function(u){
            return !u.hideUnit;
        }


    }
]);
'use strict';
(function() {
    angular.module('app').directive('userDueDates', [
        '$stateParams',
        'UserV2',
        'Class',
        function ($stateParams, UserV2,Class) {
            return {
                restrict: 'E',
                templateUrl: '/public/views/gradebook/modals/user_due_dates.html?v='+window.currentJsVersion,
                scope: {
                    units: '=',
                    userId: '=',
                    classId: '='
                },
                link: function ($scope) {
                    //private variables
                    var original = angular.copy($scope.units);

                    $scope.student ={
                        userId:$scope.userId
                    }

                    //public functions
                    $scope.canSave = canSave;
                    $scope.save = save;
                    $scope.totalForUnit = totalForUnit;
                    $scope.totalForGroup = totalForGroup;

                    function canSave() {
                        return !angular.equals(original, $scope.units) || $scope.$root.classInfo.editing;
                    }

                    function save() {
                        var pages = [];
                        var pagesToRemoveEditingFlag = []
                        $scope.saving = 1;
                        angular.forEach($scope.units, function (unit) {
                            if (!unit) return;
                            angular.forEach(unit.pagegroups, function (group) {
                                angular.forEach(group.pages, function (page) {
                                    if (page.editing){
                                        pages.push({
                                            id: page.id,
                                            page_duration: page.lesson_duration,
                                            manual_due_date: page.manual_due_date?moment(page.manual_due_date).format('YYYY-MM-DD'):null
                                        });
                                        pagesToRemoveEditingFlag.push(page);
                                    }

                                })
                            })
                        });
                        var params = {
                            id: $scope.userId,
                            pages: pages
                        };
                        if ($scope.$root.classInfo.editing) {
                            params.courseLength = $scope.$root.classInfo.courseLength
                        }
                        UserV2.updateDueDates(params,
                            function (ok) {
                                $scope.saving = 0;
                                _.each(pagesToRemoveEditingFlag,function(p){delete p.editing})
                            },
                            function (error) {
                                $scope.saving = 2;
                                $scope.error = error.error;
                            }
                        )
                    }

                    function totalForUnit(unit,force) {
                        if(unit.total && !force) return unit.total
                        var total = 0;
                        angular.forEach(unit.pagegroups, function (group) {
                            total += totalForGroup(group,force);
                        })
                        unit.total = total;
                        return total;
                    }

                    function totalForGroup(group,force) {
                        if(group.total && !force) return group.total
                        var total = 0;
                        angular.forEach(group.pages, function (page) {
                            total += page.lesson_duration;
                        })
                        group.total = total;
                        return total;
                    }
                    $scope.formatedDueDate = function(page){
                        return moment(page.calculated_due_date).format('MMMM DD YYYY')
                    }
                    $scope.toggleUnit = function(unit){
                        if(!unit.opened)
                            unit.loading = true;
                        setTimeout(function(){
                            unit.opened = !unit.opened
                            $scope.$apply()
                        });
                    }
                    $scope.finishLoadingUnit = function($last,unit){
                        if($last)
                            delete unit.loading;
                    }
                    $scope.recalculate = function(unit){
                        totalForUnit(unit,true);
                    }
                    function loadCourseLength(){
                        if($scope.student.courseLength) return;
                        $scope.student.loadingCourseLength = true;
                        Class.getClassUserDuration({
                            userId:$scope.student.userId,
                            id:$scope.classId || $scope.$root.$stateParams.classId
                        },function(res){
                            delete $scope.student.loadingCourseLength
                            $scope.student.courseLength = res.duration;
                        },function(err){
                            delete $scope.student.loadingCourseLength
                            toastr.error("Could not load course length. Please try to re-open the student window")
                        })
                    }
                    $scope.updateCourseDuration = function(){
                        $scope.student.savingCourseLength = true;
                        Class.updateClassUserDuration({
                            userId:$scope.student.userId,
                            id:$scope.classId || $scope.$root.$stateParams.classId,
                            duration:$scope.student.courseLength
                        },function(res){
                            delete $scope.student.savingCourseLength
                            toastr.success("Saved!");
                        },function(err){
                            delete $scope.student.savingCourseLength
                            toastr.error("Could not save course length. Please try to re-open the student window")
                        })
                    }
                    loadCourseLength();
                }
            }
        }
    ]).controller('DueDatesDatepickerController',['$scope',function($scope){
        $scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };
        $scope.dateOptions = {
            formatYear: 'yyyy',
            startingDay: 1
        };
        $scope.format = 'MMMM dd yyyy';
    }])
}())
"use strict";

(function () {
    var app = angular.module('app');
    app.directive('editDatesButton', ['$modal', function ($modal) {
        return {
            restrict: 'A',
            link: function (scope) {
                scope.openModal = function (classId,userId,isAttendanceOnly,class_,isAttendanceApp) {
                    $modal.open({
                        templateUrl: '/public/views/partials/editstartenddatesmodal.html?v=' + window.currentJsVersion,
                        controller:['$scope','UserClassV2',function($scope,UserClassV2){
                            $scope.loading = true;
                            UserClassV2.getDates({
                                userId:userId,
                                classId:classId.split('*')[0],
                                attendance_only:isAttendanceOnly?1:undefined
                            }).$promise.then(function(options){
                                    $scope.loading = false;
                                    $scope.options = options
                                    $scope.options.isAttendanceOnly = isAttendanceOnly;
                                    $scope.options.isAttendanceApp = isAttendanceApp;
                                    if(!isAttendanceApp && (options.manual_start_date || options.manual_expected_end_date)){
                                        $scope.options.editDates = true;
                                    }
                                    if(isAttendanceApp && (options.manual_attendance_start_date || options.manual_end_date)){
                                        $scope.options.editDates = true;
                                    }

                            })
                            function prepareStartEndDates(){
                                if(!$scope.options.editDates){
                                    $scope.options.manual_start_date = '';
                                    $scope.options.manual_attendance_start_date = '';
                                    $scope.options.manual_end_date = '';
                                    $scope.options.manual_expected_end_date = '';
                                }else{
                                    $scope.options.manual_start_date = $scope.options.showedStartDate;
                                    $scope.options.manual_attendance_start_date = $scope.options.showedAttendanceStartDate;
                                    $scope.options.manual_end_date = $scope.options.showedEndDate;
                                    $scope.options.manual_expected_end_date = $scope.options.showedExpectedEndDate;
                                }
                            }
                            $scope.save = function(){
                                prepareStartEndDates()
                                UserClassV2.saveDates({
                                    userId:userId,
                                    classId:classId.split('*')[0],
                                    attendance_only:isAttendanceOnly?1:undefined,
                                    is_attendance:isAttendanceApp?1:undefined,
                                    manual_start_date: $scope.options.manual_start_date,
                                    manual_attendance_start_date: $scope.options.manual_attendance_start_date,
                                    manual_end_date: $scope.options.manual_end_date,
                                    manual_expected_end_date: $scope.options.manual_expected_end_date,
                                }).$promise.then(function(){
                                        class_.startedDate = moment($scope.options.manual_start_date?$scope.options.manual_start_date:$scope.options.startDate).format('YYYY-MM-DD')
                                        class_.attendanceStartedDate = moment($scope.options.manual_attendance_start_date?$scope.options.manual_attendance_start_date:$scope.options.attendanceStartDate).format('YYYY-MM-DD')
                                        class_.dateLeft = moment($scope.options.manual_end_date?$scope.options.manual_end_date:$scope.options.endDate).format('YYYY-MM-DD')
                                        class_.expectedEndDate = moment($scope.options.manual_expected_end_date?$scope.options.manual_expected_end_date:$scope.options.expectedEndDate).format('YYYY-MM-DD')

                                        $scope.$close();
                                    })
                            }

                        }],
                        backdrop  : 'static',
                    })
                }
            }
        }
    }]).directive('editStartEndDates', [function () {
        return {
            restrict: 'A',
            templateUrl: '/public/views/partials/admin/editstartenddates.html?v=' + window.currentJsVersion,
            scope: {
                options: '=?'
            },
            link: function (scope) {
                scope.options = scope.options || {}

                scope.changeStartEndDate = function () {
                    if (!scope.options.editDates) {
                        scope.options.showedStartDate = scope.options.startDate;
                        scope.options.showedAttendanceStartDate = scope.options.startDate;
                        scope.options.showedEndDate = scope.options.endDate;
                        scope.options.showedExpectedEndDate = scope.options.expectedEndDate;
                    } else {
                        scope.options.showedStartDate = scope.options.manual_start_date || scope.options.startDate;
                        scope.options.showedAttendanceStartDate = scope.options.manual_attendance_start_date || scope.options.attendanceStartDate;
                        scope.options.showedEndDate = scope.options.manual_end_date || scope.options.endDate;
                        scope.options.showedExpectedEndDate = scope.options.manual_expected_end_date || scope.options.expectedEndDate;
                    }
                }
                scope.changeStartEndDate();
                scope.datePicker = {}
                scope.datePicker.today = function () {
                    scope.selected.date = new Date();
                };

                scope.datePicker.clear = function () {
                    scope.selected.date = null;
                };

                // Disable weekend selection
                scope.datePicker.disabled = function (date, mode) {
                    return false
                };


                scope.datePicker.open = function ($event, el) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    if (el) {
                        if (!scope.datePicker[el])
                            scope.datePicker[el] = {}
                        scope.datePicker[el].opened = true;
                    }
                    else
                        scope.datePicker.opened = true;
                };
                scope.datePicker.options = {
                    firstDay: 1,
                    maxDate: new Date()
                };
                scope.datePicker.dateOptions = {
                    formatYear: 'yy',
                    startingDay: 1
                };
            }
        }
    }])
}())
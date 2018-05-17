'use strict';
(function(angular){
    angular.module('app').directive("attendanceExport",['AttendanceExport','$modal',function(AttendanceExport,$modal) {
        return {
            restrict:'E',
            templateUrl:'/public/views/partials/admin/exports/export-tab.html?v='+window.currentJsVersion,
            scope:{
                orgId:'=?',
                preferences:'=?',
                prefix:'=?'
            },
            link:function(scope){
                function init(){
                    getPending();
                    getHistory();
                    scope.exporting = false;
                }
                function getPending(){
                    AttendanceExport.pending({orgId:scope.orgId}).$promise.then(function(res){
                        scope.pending = res.pending;
                        if(!_.isArray(res.corrupted)){
                            scope.corrupted = _.map(res.corrupted,function(c,id){
                                c.id = id;
                                return c
                            });
                        }
                    })
                }
                function getHistory(){
                    AttendanceExport.history({orgId:scope.orgId}).$promise.then(function(res){
                        scope.history = res;
                        scope.downloadUrl = '/api/organizations/'+scope.orgId + '/exports/attendance/download';
                    })
                }
                scope.exportNow = function(){
                    scope.exporting = true;
                    AttendanceExport.export({orgId:scope.orgId}).$promise.then(init,function(){
                        scope.exporting = false;
                        toastr.error('Could not export file. Please make sure the ftp settings are correct or email' +
                            ' us at support@english3.com.');
                    });
                };
                scope.openErrorDetails = function(details,type){
                    $modal.open({
                        templateUrl:'/public/views/partials/admin/exports/attendance-error-details.html?v='+window.currentJsVersion,
                        controller:['$scope',function($scope){
                            $scope.details = details;
                            $scope.type = type;
                            $scope.downloadUrl = function(id){
                                var params;
                                if(type=='sectionid'){
                                    params = 'classid='+id;
                                }
                                if(type=='student_idnumber'){
                                    params = 'studentid='+id;
                                }
                                return '/api/organizations/'+scope.orgId + '/exports/attendance/download?forceDownload=1&'+params;
                            }
                        }]
                    })
                }
                init();
            }
        }
    }]);
}(angular));
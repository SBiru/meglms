'use strict';
(function(angular){
    angular.module('app').directive("finalGradesExport",['FinalGradesExport',function(FinalGradesExport) {
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
                }
                function getPending(){
                    FinalGradesExport.pending({orgId:scope.orgId}).$promise.then(function(res){
                        scope.pending = res.pending;
                    })
                }
                function getHistory(){
                    FinalGradesExport.history({orgId:scope.orgId}).$promise.then(function(res){
                        scope.history = res;
                        scope.downloadUrl = '/api/organizations/'+scope.orgId + '/exports/final-grades/download';
                    })
                }
                scope.exportNow = function(){
                    FinalGradesExport.export({orgId:scope.orgId}).$promise.then(init);
                };
                init();
            }
        }
    }]);
}(angular));
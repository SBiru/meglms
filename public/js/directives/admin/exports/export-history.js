'use strict';
(function(angular){
    angular.module('app').directive("exportHistory",[function() {
        return {
            restrict:'E',
            templateUrl:'/public/views/partials/admin/exports/export-history.html?v='+window.currentJsVersion,
            scope:{
                history:'=?',
                downloadUrl:'=?'
            },
            link:function(scope){
                scope.tableHeader=[
                    {'id':'filename',label:'Filename'},
                    {'id':'number_of_entries',label:'Entries'},
                    {'id':'created_on',label:'Created on'},
                    {'id':'download',label:'',functions:{downloadUrl:function(){return scope.downloadUrl}},rowTemplate:'<a class="btn btn-sm btn-info" download  href="{{functions.downloadUrl()}}?filename={{data.filename}}"><span class="fa fa-download"></span></a>'}
                ]

            }
        }
    }]);
}(angular));
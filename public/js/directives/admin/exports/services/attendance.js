'use strict';
(function(angular){
    angular.module('app').service("AttendanceExport",['$resource',function($resource) {
        var rootUrl = '/api/organizations/:orgId/exports/attendance';
        return $resource(rootUrl,{orgId:'@orgId'},{
            download:{
                url:rootUrl+'/download'
            },
            history:{
                url:rootUrl+'/history',
                isArray:true
            },
            pending:{
                url:rootUrl+'/pending'
            },
            export:{
                method:'POST'
            }
        })
    }]);
}(angular));
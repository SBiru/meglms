'use strict';
(function(angular){
    angular.module('app').service("FinalGradesExport",['$resource',function($resource) {
        var rootUrl = '/api/organizations/:orgId/exports/final-grades';
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
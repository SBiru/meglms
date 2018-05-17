'use strict';
(function(angular){
    angular.module('app').factory('UserAlertsService',['$resource',function($resource){
        var rootUrl = '/api/user/me/alerts';
        return $resource(rootUrl,{},{
            'load':{
                method:'POST',
                url:rootUrl+'/load'
            },
            'download':{
                method:'POST',
                url:rootUrl+'/download'
            },
            'log':{
                method:'POST',
                url:rootUrl+'/log-access'
            }
        });
    }])
}(angular))

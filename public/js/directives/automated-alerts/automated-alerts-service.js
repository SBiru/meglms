
(function () {
"use strict";

angular.module('automatedAlerts')
.service('automatedAlertsService',['$resource',function($resource){
    var rootUrl = '/api/automated-alerts/:id';
    return $resource(rootUrl,{id:'@id'},{
        queryOrgAlerts:{
            url:'/api/organizations/:orgId/automated-alerts',
            params:{orgId:'@orgId'},
            isArray:true
        },
        run:{
            url:rootUrl+'/run'
        }
    })
}])

}());
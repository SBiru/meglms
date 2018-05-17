var appServices = angular.module('app.services');
appServices.factory('Announcements',['$resource',function($resource){
    return $resource('/api/organizations/:orgid/announcements/:id', {orgid:'@orgid',id:'@id',classid:'@classid'}, {
        update:{
            method:'PUT'
        },
        general:{
            url:'/api/organizations/:orgid/announcements/general',
            isArray:true
        },
        forClass:{
            url:'/api/organizations/:orgid/announcements/class/:classid',
            isArray:true
        },
        viewed:{
            method:'POST',
            url:'/api/organizations/:orgid/announcements/:id/viewed'
        },
        students:{
            url:'/api/organizations/:orgid/announcements/:id/students'
        }

    });
}]);
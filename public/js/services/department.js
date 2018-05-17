'use strict';
try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices.factory('Department',
    [
        '$resource',
        function($resource){

            var rootURL = '/api/departments';
            var deptUrl = rootURL + '/:id';
            var orgURL = '/api/organizations/:orgId/departments';
            return $resource(rootURL,{orgId:'@orgId',id:'@id'},{
                getOrgDepartments:{
                    method:'GET',
                    url:orgURL,
                    isArray:true
                },
                getUsers:{
                    method:'GET',
                    url:deptUrl + '/users',
                    isArray:true
                },
            });

        }
    ]
);

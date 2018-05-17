'use strict';
try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices.factory('OrganizationV2',
    [
        '$resource',
        function($resource){

            var rootURL = '/api/organizations/:id';
            var resource = $resource(rootURL,{id:'@id'},{
                updatePreferences:{
                    method:'POST',
                    url:rootURL+'/preferences'
                },
                getUsers:{
                    method:'GET',
                    url: rootURL+'/users',
                    isArray: true
                },
                getClasses:{
                    method:'GET',
                    url: rootURL+'/classes',
                    isArray: true
                }
                ,
                getQuizzes:{
                    method:'GET',
                    url: rootURL+'/quizzes',
                    isArray: true
                },
                getAdvisors:{
                    method:'GET',
                    url: rootURL+'/advisors',
                    isArray: true
                },
                updatePagePermissions:{
                    method:'PUT',
                    url: rootURL+'/pagepermissions'
                },
                updateBlackoutDates:{
                    method:'PUT',
                    url: rootURL+'/blackouts'
                }
            });
            return resource;
        }
    ]
);

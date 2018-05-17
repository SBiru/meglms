'use strict';
try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices.factory('WordBank',
    [
        '$resource',
        function($resource){

            var rootURL = '/api/organizations/:orgId/word-bank/:id';

            return $resource(rootURL,{orgId:'@orgId',id:'@id'},{
                randomWords:{
                    url:'/api/organizations/:orgId/word-bank/random/:limit',
                    params:{'limit':'@limit'},
                    isArray:true
                }
            });

        }
    ]
);

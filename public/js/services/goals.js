'use strict';
try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices.factory('Goals',
    [
        '$resource',
        function($resource){

            var rootURL = '/api/user/:userId/goals';

            return $resource(rootURL,{userId:'@userId',id:'@id'},{
                'markAsCompleted':{
                    url:rootURL+'/:id',
                    method:'POST'
                },
                'saveComment':{
                    url:rootURL+'/:id/comment',
                    method:'POST'
                },
                'delete':{
                    url:rootURL+'/:id',
                    method:'DELETE'
                }

            });

        }
    ]
);

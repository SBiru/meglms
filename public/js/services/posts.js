'use strict';
try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices.factory('PostV2',
    [	'$resource',
        function ($resource) {
            var factory = {};
            factory.needingGrade = {
                byOrg:function(params, onSuccess, onFail){
                    return $resource('/api/organizations/:id/posts/needing-grade',{id:'@id'})
                        .get(params, onSuccess, onFail);
                },
                byClass:function(params, onSuccess, onFail){
                    return $resource('/api/classes/:id/posts/needing-grade',{id:'@id'})
                        .get(params, onSuccess, onFail);
                },
                byPage:function(params, onSuccess, onFail){
                    return $resource('/api/pages/:id/posts/needing-grade',{id:'@id'})
                        .get(params, onSuccess, onFail);
                },

            };
            factory.countNeedingGrade = $resource('/api/posts/count-needing-grade').get;
            factory.resubmissions = $resource('/api/classes/:id/posts/resubmissions').get;

            return factory;
        }
]);
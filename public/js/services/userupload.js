'use strict';
try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
app

.service('UserUpload',
[	'$q',
    '$http',
    '$resource',
    'Upload',
    function($q, $http,$resource,Upload){
        var rootUrl = '/api/users/upload/:orgId';
        var factory = $resource(rootUrl,{orgId:'@orgId'},{
            'import':{
                url: rootUrl+'/import',
                method:'POST'
            }
        });
        factory.preview = function(file,orgId,options,onProgress,onSuccess,onError){
            var url = '/api/users/upload/'+orgId+'/preview';
            Upload.upload({
                'url': url,
                'fields': options,
                'file': file
            }).progress(onProgress).success(onSuccess).error(onError);
        };
        factory.importUpload = function(file,orgId,options,onProgress,onSuccess,onError){
            var url = '/api/users/upload/'+orgId+'/import';
            Upload.upload({
                'url': url,
                'fields': options,
                'file': file
            }).progress(onProgress).success(onSuccess).error(onError);
        };
        return factory

    }
]
)
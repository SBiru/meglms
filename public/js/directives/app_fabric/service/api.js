'use strict';
(function(angular){
    angular.module('ngFabric').service('FabricTemplatesApi',['$resource',function($resource){
        var rootUrl = '/api/canvas-templates';
        return $resource(rootUrl,{id:'@id'},{
            'get':{
                url:rootUrl+'/:id'
            },
            'getProperties':{
                url:rootUrl+'/:id/properties'
            },
            'clone':{
                url:rootUrl+'/:id/clone',
                method:'POST'
            },
            'delete':{
                url:rootUrl+'/:id',
                method:'DELETE'
            }

        });

    }])
}(angular))

'use strict';

angular.module('app')
    .service('SiteAdmin',
    [	'$resource',
        function ($resource) {
            var rootUrl = '/api/sites/:siteId/admins'
            return $resource(rootUrl,{userId:'@userId',siteId:'@siteId'},{
                sitesForUser:{
                    url:'/api/user/:userId/sites-admin',
                    isArray:true
                },
                adminsForSite:{
                    isArray:true
                },
                addUserAdmin:{
                    method:'POST'
                },
                removeUserAdmin:{
                    url:rootUrl + '/:userId',
                    method:'DELETE'
                },
                removeAllFromUser:{
                    url:'/api/user/:userId/sites-admin',
                    method:'DELETE'
                }
            });
        }
    ]
);
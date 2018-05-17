'use strict';

angular.module('app')
    .service('HtmlTemplates',
    [	'$resource',
        function ($resource) {
            var rootUrl = '/api/organizations/:orgId/htmltemplate/:id'
            return $resource(rootUrl,{orgId:'@orgId',id:'@id'},{
                userResponse:{
                    url:'/api/posts/:id/htmlresponse'
                }
            });
        }
    ]
);
'use strict';

angular.module('app')
    .service('QuestionBank',
    [	'$resource',
        function ($resource) {

            var rootUrl = '/service.testbank.bank';


            return $resource(rootUrl,{},{
                details:{
                    url:rootUrl+'/details/:id',
                    params:{id:'@id'}
                },
                getByOrg:{
                    url:rootUrl+'/get-by-org/:id',
                    params:{id:'@id'}
                }
            });
        }
    ]
);
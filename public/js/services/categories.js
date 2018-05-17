'use strict';

try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
app
    .service('Categories',
    [	'$q',
        '$http',
        '$resource',
        function($q, $http, $resource){
            var classUrl = '/api/classes/:classId/categories';
            var classResourse = $resource(classUrl,{'classId':'@classId'});

            var userUrl = '/api/user/:userId/categories';
            var userResourse = $resource(userUrl,{'userId':'@userId'},{
                'performance':{
                    url:'/api/user/:userId/students-performance'
                },
                'classes':{
                    url:'/api/user/:userId/students-performance/classes',
                    isArray:true
                },
                updatePerformance:{
                    url:'/api/students-performance/update',
                    method:'POST'
                }
            });
            return {
                class:classResourse,
                user:userResourse
            }
        }
    ]
);
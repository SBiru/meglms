'use strict';

try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
app

    .service('Attendance',
    [	'$resource',
        function ($resource) {
            var rootURL = '/api/user/:userId/attendance';
            return $resource(rootURL,{'userId':'@userId','layoutId':'@layoutId'},
                {
                    all:{
                        method:'POST',
                        url:'/api/attendance'
                    },
                    approve:{
                        method: 'POST',
                        url: rootURL + '/approved'
                    },
                    layouts:{
                        url:'/api/attendance/layouts',
                        isArray:true
                    },
                    layout:{
                        url:'/api/attendance/layouts/:layoutId'
                    },
                    saveLayout:{
                        url:'/api/attendance/layouts',
                        method:'POST'
                    },
                    deleteLayout:{
                        url:'/api/attendance/layouts/:layoutId',
                        method:'DELETE'
                    },
                    getMissing:{
                        url:'/api/attendance/missing',
                        method:'POST'
                    },
                    getSyncHistory:{
                        url:'/api/attendance/sync-history',
                        isArray:true
                    },
                    export:{
                        url:'/api/attendance/export',
                        method:'POST'
                    },
                    syncQueue:{
                        url:'/api/attendance/queue'
                    }
                    ,
                    studentReport:{
                        url:rootURL + '/report'
                    }
                }
            );
        }
    ]
);
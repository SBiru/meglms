// when we later move http requests to a unified resource, all http requests found here
// should be moved there
'use strict';
try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
app.service('UserClassV2',
    [	'$resource',
        function($resource){
            var rootUrl = '/api/classes/:classId/user/:userId'
            return $resource(rootUrl,{classId:'@classId',userId:'@userId'},{
                getDates:{
                    url:rootUrl+'/dates'
                },
                saveDates:{
                    url:rootUrl+'/dates',
                    method:'POST'
                },
            })

        }
    ]
);

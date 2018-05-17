// when we later move http requests to a unified resource, all http requests found here
// should be moved there
'use strict';

try {
	var app = angular.module('app.testbank');
}
catch(err) {
	var app = angular.module('app');
}
app
.service('Assignment',
	[	'$q',
		'$http',
		'$resource',
		function($q, $http, $resource){
			var service = {};

			service.byClass = function(classId,grouped){
				var def = $q.defer();
				if(!classId) {
					def.resolve(null);
				} else {
					var url = '/assignments?classid=' + classId;
					if(grouped){
						url+='&grouped=1';
					}
					$http.get(url).then(function (results) {
						// clean/filter results here if needed
						def.resolve(results.data);
					});
				}
				return def.promise;
			};

			service.byUserId = function(userId,grouped){
				var def = $q.defer();
				if(!userId) {
					def.resolve(null);
				} else {
					var url = '/assignments?userid=' + userId;
					if(grouped){
						url+='&grouped=1';
					}
					$http.get(url).then(function (results) {
						// clean/filter results here if needed
						def.resolve(results.data);
					});
				}
				return def.promise;
			};

			service.getExemptStudents = function(params, onSuccess, onFail){
				var resource = $resource('/classes/:classId/assignments/:assignmentId/exempts');
				return resource.get(params, onSuccess, onFail);
			};

			service.updateExempt = function(params, onSuccess, onFail){
				var resource = $resource('/classes/:classId/assignments/:assignmentId/exempts',
					{classId:'@classId', assignmentId:'@assignmentId'},
					{'update': { method:'PUT' }}
				);
				return resource.update(params, onSuccess, onFail);
			};
			service.updateExempt = function(params, onSuccess, onFail){
				var resource = $resource('/classes/:classId/assignments/:assignmentId/exempts',
					{classId:'@classId', assignmentId:'@assignmentId'},
					{'update': { method:'PUT' }}
				);
				return resource.update(params, onSuccess, onFail);
			};

			return service;
		}
	]
);

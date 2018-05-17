// when we later move http requests to a unified resource, all http requests found here
// should be moved there
'use strict';

angular.module('app')
.service('Clone',
	[	'$q',
		'$http',
		function($q, $http){
			var factory = {};

			factory.cloneCourse = function(source, target,cloneQuizzes,clonePrompts){
				var def = $q.defer();
				if(!source || !target) {
					def.reject({message: 'empty source or target'});
				} else {
					$http.post('/api/clone/course/' + source, {target: target,cloneQuizzes:cloneQuizzes,clonePrompts:clonePrompts}).then(
						function (result) {
							// clean/filter results here if needed
							def.resolve(result.data);
						},
						function (error) {
							def.reject(error);
						}
					);
				}
				return def.promise;
			};

			return factory;
		}
	]
);

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

.service('UserV2',
	[	'$q',
		'$http',
		'$resource',
		function($q, $http,$resource){
			var factory = {};
			var rootURL = '/api/user/:id';
			var rootResource = $resource(rootURL,{'id':'@id'},
				{
					'getHistory': {
						url: rootURL + '/history/all'
					},
					'getTimeSpent':{
						url: rootURL + '/history'
					},
					updateDueDates:{
						url: rootURL + '/due_dates',
						method: 'POST'
					},
					getSpecificUsers:{
						url:'/api/users',
						method:'POST',
						isArray:true
					},
					setMenuPreference:{
						url:rootURL + '/menu',
						method:'POST'
					},
					setGraderMenuPreference:{
						url:rootURL + '/gradermenu',
						method:'POST'
					},
					getStudents:{
						url:rootURL + '/students',
						isArray:true
					}

				}
			);
			factory.getUser = function(userId, params){
				var query = '';
				if(userId) {
					query += '/' + userId;
				}
				if(params) {
					query += '?' + params;
				}
				var def = $q.defer();
				if(factory.user && !userId && !params){
					def.resolve(factory.user);
				}else{
					$http.get('/api/user' + query).then(
						function (results) {
							// clean/filter results here if needed
							def.resolve(results.data);
							if(!userId)factory.user = results.data
						},
						function (error) {
							def.reject(error);
						}
					);
				}
				return def.promise;
			};
			factory.getUsers = $resource('/api/users').query;
			factory.getSpecificUsers = rootResource.getSpecificUsers;
			factory.getHistory = rootResource.getHistory
			factory.getTimeSpent = rootResource.getTimeSpent
			factory.updateDueDates = rootResource.updateDueDates
			factory.setMenuPreference = rootResource.setMenuPreference
			factory.setGraderMenuPreference = rootResource.setGraderMenuPreference
			factory.getStudents = rootResource.getStudents

			factory.prepareUserName = function(by,fname,lname){
				if(by=='fname'){
					return fname + ' ' + lname;
				}else{
					return lname + ', ' + fname;
				}
			}

			factory.updateUser = function(userId, params){
				var query = '';
				if(userId) {
					query += '/' + userId;
				}

				var def = $q.defer();
				$http.put('/api/user' + query,params).then(
					function (results) {
						// clean/filter results here if needed
						def.resolve(results.data);
					},
					function (error) {
						def.reject(error);
					}
				);
				return def.promise;
			};

			return factory;
		}
	]
);

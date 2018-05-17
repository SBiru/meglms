'use strict';

try {
	var app = angular.module('app.testbank');
}
catch(err) {
	var app = angular.module('app');
}
app

.service('Class',
	[	'$resource',
		function ($resource) {
			var service = {};
			var rootURL = '/classes/:id';
			var rootResource = $resource(rootURL,{'id':'@id','userId':'@userId'},
				{
					'getForAdvisor':{
						url:'/api/classes/advisees',
						isArray:true
					},
					'getGroup':{
						url:rootURL + '/groups/:groupId'
					},
					'getGroups':{
						url:rootURL + '/groups',
						isArray:true
					},
					'updateDurations':{
						url:rootURL + '/durations',
						method:'PUT'
					},
					'calculateDueDates':{
						url:rootURL + '/duedates/:userId',
						method:'POST'
					},
					'getPasswords':{
						url:'/api/classes/:id/passwords',
						method:'GET',
						isArray:true
					},
					'getAssignments':{
						url:rootURL + '/assignments',
						method:'GET',
						isArray:true
					},
					'getExemptAssignmentsForUser':{
						url:rootURL + '/assignments/exempts/:userId',
						method:'GET',
						isArray:true
					},
					'updateExemptPages':{
						url:rootURL + '/assignments/exempts/:userId',
						method:'POST'
					},
					'deleteUserData':{
						url:rootURL + '/users/:userId',
						method:'DELETE'
					},
					'updatePasswords':{
						url:'/api/classes/:id/passwords',
						method:'POST'
					},
					'downloadGradebook':{
						url:'/classes/:id/csv',
						method:'GET'
					},
					exportEnrollmentAsCsv:{
						url:'/classes/:id/enrollment/csv',
						method:'GET'
					},
					updateClassUserDuration:{
						url:'/classes/:id/duration/:userId',
						method:'POST'
					},
					getClassUserDuration:{
						url:'/classes/:id/duration/:userId',
						method:'GET'
					},
					containsTimedReview:{
						url:'/classes/:id/has-timed-review',
						method:'GET'
					}
				}
			);
			service.get = function(params, onSuccess, onFail){
				var resource = $resource(rootURL);
				return resource.get(params, onSuccess, onFail);
			};
			service.query = function(params, onSuccess, onFail){
				var resource = $resource(rootURL);
				return resource.query(params, onSuccess, onFail);
			};

			service.getStudents = function(params, onSuccess, onFail){
				var resource = $resource(rootURL + '/users');
				return resource.get(params, onSuccess, onFail);
			};

			service.finalizeGrade = function(params, onSuccess, onFail){
				var resource = $resource(rootURL + '/grades', params, {'save':{method:'POST'}});
				return resource.save(params, onSuccess, onFail);
			};
			service.getGroup = rootResource.getGroup;
			service.getGroups = rootResource.getGroups;
			service.updateDurations = rootResource.updateDurations;
			service.calculateDueDates = rootResource.calculateDueDates;
			service.getAssignments = rootResource.getAssignments;
			service.getExemptAssignmentsForUser = rootResource.getExemptAssignmentsForUser;
			service.updateExemptPages = rootResource.updateExemptPages;
			service.deleteUserData = rootResource.deleteUserData;
			service.updatePasswords = rootResource.updatePasswords;
			service.getPasswords = rootResource.getPasswords;
			service.downloadGradebook = rootResource.downloadGradebook;
			service.exportEnrollmentAsCsv = rootResource.exportEnrollmentAsCsv;
			service.updateClassUserDuration = rootResource.updateClassUserDuration;
			service.getClassUserDuration = rootResource.getClassUserDuration;
			service.containsTimedReview = rootResource.containsTimedReview;
			service.getForAdvisor = rootResource.getForAdvisor;



			return service;
		}
	]
);
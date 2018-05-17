// when we later move http requests to a unified resource, all http requests found here
// should be moved there
'use strict';

try {
	var appServices = angular.module('app.testbank.service');
}
catch(err) {
	var appServices = angular.module('app.services');
}
appServices
.service('Gradebook',
	[	'$q',
		'$http',
		'$resource',
		'Alerts',
		function($q, $http, $resource,Alerts){
			var factory = {};
			var canceller =  $q.defer();
			factory.canceller =canceller.promise;
			function createResourceInstance() {
				return $resource('/classes/:classId/gradebook',{'classId':'@classId'},{
					getForUser:{
						url:'/api/user/:userId/gradebook',
						params:{userId:'@userId'}
					},
					save:{
						method:'POST',
						timeout: factory.canceller
					}
				});
			}
			var gradebookResouce =createResourceInstance();
			var progressReportResouce = $resource('/classes/:classId/progress-report', {'classId':'@classId','userId':'@userId'},{
				getForUser:{
					method:'GET',
					url:'/api/user/:userId/progress-report'
				},getForUserClass:{
					method:'GET',
					url:'/classes/:classId/progress-report/:userId'
				}
			});
			factory.cancelRequests = function(){
				canceller.resolve();
				canceller =  $q.defer();
				factory.canceller =canceller.promise;
				gradebookResouce =createResourceInstance();
			};
			factory.getClass = function(classId, params){
				var query = '';
				if(classId) {
					query += '/' + classId;
				}
				if(params) {
					query += '?' + params;
				}
				var def = $q.defer();
				if(!classId) {
					def.reject(null);
				} else {
					$http.get('/classes' + query).then(
						function (results) {
							// clean/filter results here if needed
							def.resolve(results.data);
						},
						function (error) {
							def.reject(error);
						}
					);
				}
				return def.promise;
			};
			factory.downloadAsCsv = $resource('/api/gradebook/download').save;
			factory.downloadAsXls = function(data){
				var options = {
					data:data,
					httpMethod:'POST'
				}
				jQuery.fileDownload('/api/gradesxls',options)
			}
			factory.sendReportToUsers = $resource('/api/progress-report/send-email').save;

			factory.giveExtraAttempt = function(params, onSuccess, onFail){
				var attemptsResource = $resource('/api/pages/:pageId/attempts/:userId', params, {'update':{method:'PUT'}});
				return attemptsResource.update(params, onSuccess, onFail);
			};

			factory.overrideScore = function(classId, pageId, userId, score){
				var def = $q.defer();
				if(!classId || !pageId || !userId) {
					def.resolve(null);
				} else {
					var params = {classId: parseInt(classId), pageId: pageId, userId: userId, score: score};
					$http.post('/classes/overrides', params).then(function (result) {
						// clean/filter results here if needed
						def.resolve(result.data);
					});
				}
				return def.promise;
			};

			factory.exempt = function(classId, pageId, userId, comments, unexempt,isCredited){
				var def = $q.defer();
				if(!classId || !pageId || !userId) {
					def.resolve(null);
				} else {
					var params = { comments: comments,credited: isCredited};
					var url = '/classes/' + classId + '/assignments/' + pageId + '/exempts/' + userId;
					if(unexempt) {
						// removing user from exempts list
						$http.delete(url, params).then(function(result) {
							// clean/filter results here if needed
							def.resolve(result.data);
						});
					} else {
						// adding user to exempts list
						$http.post(url, params).then(function(result) {
							// clean/filter results here if needed
							def.resolve(result.data);
						});
					}
				}
				return def.promise;
			};

			// alias function
			factory.unexempt = function(classId, pageId, userId){
				return factory.exempt(classId, pageId, userId, null, true);
			};

			factory.getClassGrades = function(classId, from, to){
				var query = 'includeUsers=true&includeGrades=true';
				if(from && to) {
					query += '&from=' + from + '&to=' + to;
				}
				return factory.getClass(classId, query);
			};
			factory.getCachedClassGrades = function(params, onSuccess, onFail){
				return gradebookResouce.get(params, onSuccess, onFail);
			};
			factory.getProgressReport = function(params, onSuccess, onFail){
				return progressReportResouce.get(params, onSuccess, onFail);
			};
			factory.getProgressReportForUser = function(params, onSuccess, onFail){
				return progressReportResouce.getForUser(params, onSuccess, onFail);
			};
			factory.getProgressReportForUserClass = progressReportResouce.getForUserClass

			factory.getGradebookForUser = function(params, onSuccess, onFail){
				return gradebookResouce.getForUser(params, onSuccess, onFail);
			};
			factory.recalculateGrades = function(params, onSuccess, onFail){
				return gradebookResouce.save(params, onSuccess, onFail);
			};

			factory.filterStudents = function(input, field, regex) {
				var defer = $q.defer();
				var pattern = new RegExp(regex);
				var out = [];
				for (var i = 0; i < input.length; i++){
					if(pattern.test(input[i][field])) {
						out.push(input[i]);
					}
				}
				defer.resolve(out);
				return defer.promise;
			};

			factory.openRecalculationWarning = function(callback,callbackCancel){
				Alerts.warning({
					title:'Gradebook recalculation is needed',
					content:"Your gradebook needs to be recalculated. If you choose not to recalculate it now, the numbers will be updated next time you load this class' gradebook.",
					textOk:'Recalculate now',
					textCancel:'Recalculate later',
				},
					callback,
					callbackCancel
				);
			}

			return factory;
		}
	]
);

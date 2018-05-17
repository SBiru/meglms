// when we later move http requests to a unified resource, all http requests found here
// should be moved there
'use strict';

angular.module('app')
.service('Import',
	[	'$q',
		'$http',
		'$interval',
		'$timeout',
		'Upload',
		function($q, $http, $interval, $timeout, Upload){
			var factory = {};
			// refresh timeout to keep connection alive (user signed in)
			var keepAlivePromise;
			factory.keepAlive = {};

			// load previously uploaded files
			factory.getPreviousUploads = function(){
				var def = $q.defer();
				$http.get('/api/imports').then(
					function (result) {
						// clean/filter results here if needed
						def.resolve(result.data);
					},
					function (error) {
						def.reject(error);
					}
				);
				return def.promise;
			};

			// load tree from saved map tree
			factory.fromPrevious = function(mapFile){
				var def = $q.defer();
				$http.get('/api/imports?mapFile=' + mapFile).then(
					function (result) {
						// clean/filter results here if needed
						def.resolve(result.data);
					},
					function (error) {
						def.reject(error);
					}
				);
				return def.promise;
			};

			// discard selected previous upload
			factory.discard = function(mapFile){
				var def = $q.defer();
				$http.delete('/api/imports/' + mapFile).then(
					function (result) {
						def.resolve(result.data);
					}
				);
				return def.promise;
			};

			factory.upload = function(file, type, onProgress, onSuccess, onError){
				var url = '/api/imports/';
				type = type.toLowerCase();
				// set url according to type
				switch(type) {
					case 'moodle':
						url += 'moodle';
						break;
					default:
						onError();
						return;
				}
				Upload.upload({
					'url': url,
					'fields': null,
					'file': file
				}).progress(onProgress).success(onSuccess).error(onError);
			};

			factory.uploadPowerschool = function(file, orgId, onProgress, onSuccess, onError,async){
				var url = '/api/imports/powerschool';
				Upload.upload({
					'url': url,
					'fields': { 'orgId': orgId, 'async': async },
					'file': file
				}).progress(onProgress).success(onSuccess).error(onError);
			};

			factory.uploadMoodleData = function(file, classId, onProgress, onSuccess, onError,async){
				var url = '/api/imports/moodle';
				Upload.upload({
					'url': url,
					'fields': {
						'classId': classId,
						'isStudentData': true,
						'async': async
					},
					'file': file
				}).progress(onProgress).success(onSuccess).error(onError);
			};

			factory.import = function(data, courseId){
				// set url according to type
				var def = $q.defer();
				if(!data || !courseId) {
					def.reject({message: 'empty data or courseId'});
				} else {
					data.courseId = courseId;
					$http.post('/api/imports', {data: data}).then(
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

			// starts interval to refresh session (every minute)
			factory.keepAlive.start = function() {
				factory.keepAlive.stop();
				keepAlivePromise = $interval(function() {
					$http.get('/stoptimeout');
				}, 60000, false);
			};

			// clear existing intervals (if any)
			factory.keepAlive.stop = function() {
				$interval.cancel(keepAlivePromise);
			};

			return factory;
		}
	]
);

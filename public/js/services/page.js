'use strict';

angular.module('app')
	.service('Page',
	[	'$q',
		'$http',
		'$resource',
		function ($q, $http, $resource) {
			var factory = {};

			var resource = $resource('/api/pages/:id',{id:'@id',unitId:'@unitId'},{
				moveToUnit:{
					method:'PUT',
					url:'/api/pages/:id/unit/:unitId'
				},
				movePage:{
					method:'PUT',
					url:'/api/pages/:id/move'
				},
				changeMaxPoints:{
					method:'GET',
					url:'/api/pages/:id/grademax'
				},
				getPosts:{
					method:'GET',
					isArray:true,
					url:'/api/pages/:id/posts'
				},
				courseDescription:{
					method:'GET',
					url:'/api/pages/:id/coursedescription'
				},
				userInformation:{
					method:'GET',
					url:'/api/pages/:id/userinformation'
				},

				saveUserInformation:{
					method:'POST',
					url:'/api/pages/:id/userinformation'
				}

			});

			factory.get = function(params, onSuccess, onFail){
				return resource.get(params, onSuccess, onFail);
			};

			factory.moveToUnit = resource.moveToUnit;
			factory.movePage = resource.movePage;
			factory.changeMaxPoints = resource.changeMaxPoints;
			factory.getPosts = resource.getPosts;
			factory.courseDescription = resource.courseDescription;
			factory.userInformation = resource.userInformation;
			factory.saveUserInformation = resource.saveUserInformation;


			factory.tryPassword = function(params){
				var defer = $q.defer();
				resource.get(
					params,
					function(result) {
						defer.resolve(result);
					},
					function(error) {
						defer.reject(error);
					}
				);
				return defer.promise;
			};

			return factory;
		}
	]
);
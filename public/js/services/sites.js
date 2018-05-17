'use strict';

angular.module('app')
.service('Site',
	[	'$resource',
		function ($resource) {
			var factory = {};

			factory.getOrgSites = function(params, onSuccess, onFail){
				return $resource('/api/organizations/:orgId/sites',{orgId:'@orgId'}).query(params, onSuccess, onFail);
			};
			factory.saveOrgSite = function(params, onSuccess, onFail){
				return $resource('/api/organizations/:orgId/sites',{orgId:'@orgId', name: '@name', externalId: '@externalId'}).save(params, onSuccess, onFail);
			};
			factory.updateOrgSite = function(params, onSuccess, onFail){
				return $resource('/api/organizations/:orgId/sites',{orgId:'@orgId', name: '@name', externalId: '@externalId'},
					{
						'update': { method:'PUT' }
					}).update(params, onSuccess, onFail);
			};
			factory.updateBlackoutDates = function(params, onSuccess, onFail){
				return $resource('/api/sites/:id/blackouts',{id:'@id'},
					{
						'update': { method:'PUT' }
					}).update(params, onSuccess, onFail);
			};

			return factory;
		}
	]
);
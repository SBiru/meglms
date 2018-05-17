'use strict';

angular.module('app')
.service('Report',
	[	'$q',
		'$http',
		'$resource',
		'$rootScope',
		'$filter',
		'Site',
		'OrganizationV2',
		function($q, $http,$resource,$rootScope,$filter,Site,OrganizationV2){
			var factory = {};
			var rootUrl = '/api/reports'
			var rootResource = $resource(rootUrl,{},{
				export_activity:{
					url:rootUrl+'/export/activity',
					method:'POST'
				},
				enabled_reports:{
                    url:rootUrl+'/org/:orgId',
                    params:{
                    	orgId:'@orgId'
					}
				}

			});
			factory.loadingReport={};
			factory.retrieve = function(number,params){
				var def = $q.defer();
				factory.loadingReport[number]=true;
				var url = '/api/reports/' + number;
				if(params)
					url+='?' + jQuery.param(params);
				$http.get(url).then(
					function (result) {
						factory.loadingReport[number]=false;
						def.resolve(result.data);
					},
					function (error) {
						factory.loadingReport[number]=false;
						def.reject(error);
					}
				);
				return def.promise;
			};
			factory.export = {
				activity:rootResource.export_activity
			}
			factory.getSites = function(completion,loading,trackAttendance){
				loading.sites=true;
				var sites;
				Site.getOrgSites({orgId:$rootScope.me.orgId,trackAttendance:true},
					function(sites){
						loading.sites=false;
						var total = 0;

						sites = _.map(sites,function(s){
							s.count = s.users.length;
							s.students = s.users;
							s.text = s.name + '(' + s.count + ')'
							s.value = s.name;
							total+=s.count;
							return s
						});
						sites = $filter('orderBy')(sites,'name');
						sites.splice(0,0,{
							'name':null,
							'text':'All sites (' + total + ' students)',
							'value':'all'
						})
						completion(sites);

					},function(error){
						loading.sites=false;
						completion(false,error);
					}
				)
			};

			factory.getCoaches = function(completion,loading){
				loading.advisors=true
				OrganizationV2.getAdvisors({
						id:$rootScope.me.orgId,
						trackAttendance:true
					},
					function(advisors){
						_.each(advisors,function(a){
							a.name= a.lastName + ', ' + a.firstName + '(' + a.students.length+')';
						})
						loading.advisors=false
						completion($filter('orderBy')(advisors,'name'))
					},
					function (error){
						loading.advisors=false
						completion(false,error);
					}
				)
			};
			factory.getClasses = function (completion,loading){
				loading.classes=true
				OrganizationV2.getClasses({
						id:$rootScope.me.orgId
					},
					function(classes){
						loading.classes=false
						completion(classes);
					},
					function (error){
						loading.classes=false
						completion(false,error);
					}
				)
			};
            factory.getEnabled = function (orgId,completion,loading){
                loading.enabledReports=true
                rootResource.enabled_reports({
                        orgId:orgId
                    },
                    function(reports){
                        loading.enabledReports=false;
                        completion(reports);
                    },
                    function (error){
                        loading.enabledReports=false;
                        completion(false,error);
                    }
                )
            };
			return factory;
		}
	]
);

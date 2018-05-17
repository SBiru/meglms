'use strict';
function dateToString(date){
	return date.toISOString().substr(0,10);
}
function getAllDaysOfWeek(startDate,dayOfWeek){
	var allDays = [];
	var nextDay = new Date(startDate);
	var endDate = new Date(nextDay.getFullYear()+2,nextDay.getMonth(),nextDay.getDate());

	while (nextDay!=endDate){

		if(nextDay.getDay()==dayOfWeek)
			allDays.push(dateToString(nextDay));
		nextDay.setDate(nextDay.getDate()+1);
		nextDay.setHours(0,0,0,0);
	}

	return allDays;
}
var checkModelDefault = {
	mon:false,
	tue:false,
	wed:false,
	thu:false,
	fri:false,
	sat:false,
	sun:false,
}
angular.module('app')
	.controller('EditSitesModal',
	[	'$scope',
		'$modalInstance',
		'orgId',
		'Site',
		'OrganizationV2',
		function($scope, $modalInstance, orgId, Site, OrganizationV2){
			// tab scope containers
			var today = new Date();
			$scope.calendarSection = {
				othersCalendar: new Date(today.getFullYear(),0,1),
			};
			$scope.sitesSection = {};
			$scope.usersSection = {
				'addedIds' : []
			};

			$scope.loading = true;
			// load org info
			OrganizationV2.get(
				{'id': orgId},
				function(org){
					$scope.loading = false;

					$scope.organization = org;

					if(org.blackouts) {
						reloadSites();
						reloadStudents();
					}

				},
				function(error){
					$scope.error = error.error;
				}
			);

			var reloadSites = function(){
				Site.getOrgSites(
					{'orgId': orgId},
					function(sites){
						$scope.sites = sites;
						$scope.loading = false;
						$scope.usersSection.site = null;
						$scope.sitesSection.saving = false;
					},
					function(error){
						$scope.error = error.error;
					}
				);
			};
			var reloadStudents = function(){
				OrganizationV2.getUsers(
					{'id': orgId, 'notInSites': true},
					function(users){
						$scope.users = users;
						$scope.loading = false;
					},
					function(error){
						$scope.error = error.error;
					}
				);
			};
			var reloadBlackoutDays = function(){
				OrganizationV2.get(
					{'id': orgId},
					function(org){
						$scope.organization.blackouts = org.blackouts;
						$scope.$root.refreshDatepicker();
					}
				);
			};
			var startWeekDaysModel = function(){
				if(!$scope.blackouts) return;
				if($scope.blackouts.weekdays){
					$scope.calendarSection.checkModel = angular.copy(checkModelDefault);
					var weekIndexes = {
						1:'mon',
						2:'tue',
						3:'wed',
						4:'thu',
						5:'fri',
						6:'sat',
						0:'sun',
					};
					for(var i in $scope.blackouts.weekdays){
						var index = $scope.blackouts.weekdays[i];
						$scope.calendarSection.checkModel[weekIndexes[index]]=index;
					}
				}
			};


			$scope.$watch('usersSection.site', function(newVal){
				$scope.usersSection.addedIds = [];
				if(!newVal){
					return;
				}
				angular.forEach(newVal.users, function(user){
					$scope.usersSection.addedIds.push(user.id);
				});
			});

			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};

			$scope.sitesSection.create = function () {
				if(!$scope.creating) {
					$scope.sitesSection.new = {};
					$scope.sitesSection.creating = true;
				}
			};

			$scope.sitesSection.edit = function (site) {
				if(!$scope.sitesSection.editing) {
					$scope.sitesSection.edited = angular.copy(site);
					$scope.sitesSection.editing = true;
				} else {
					$scope.sitesSection.edited = angular.copy(site);
				}
			};

			$scope.sitesSection.saveNew = function () {
				if($scope.sitesSection.creating && $scope.sitesSection.new.name) {
					$scope.sitesSection.saving = true;
					Site.saveOrgSite(
						{
							'orgId': orgId,
							'name': $scope.sitesSection.new.name,
							'externalId': $scope.sitesSection.new.externalId
						},
						function(){
							$scope.sitesSection.creating = false;
							reloadSites();
						},
						function(error){
							$scope.error = error.error;
						}
					);
				}
			};

			$scope.sitesSection.saveEdited = function () {
				if($scope.sitesSection.editing && $scope.sitesSection.edited.name) {
					$scope.sitesSection.saving = true;
					Site.updateOrgSite(
						{
							'orgId': orgId,
							'site': $scope.sitesSection.edited
						},
						function(){
							$scope.sitesSection.editing = false;
							reloadSites();
						},
						function(error){
							$scope.error = error.error;
						}
					);
				}
			};

			$scope.usersSection.isInSite = function(user){
				return ($scope.usersSection.addedIds.indexOf(user.id) > -1);
			};
			$scope.usersSection.hasUserInSite = function(){
				if(!$scope.sites) return false;
				for(var i in $scope.sites){
					var site = $scope.sites[i];
					if(!site.users) continue;
					if(site.users.length)
						return true;
				}
				return false;
			};

			$scope.usersSection.addToSite = function(user){
				if(!$scope.usersSection.isInSite(user)) {
					$scope.usersSection.addedIds.push(user.id);
					$scope.usersSection.site.users.push(user);
				}
			};

			$scope.usersSection.removeFromSite = function(user){
				if($scope.usersSection.isInSite(user)) {
					$scope.usersSection.addedIds.splice($scope.usersSection.addedIds.indexOf(user.id), 1);
					$scope.usersSection.site.users.splice($scope.usersSection.site.users.indexOf(user), 1);
				}
			};

			$scope.usersSection.save = function(){
				if($scope.usersSection.site){
					$scope.usersSection.saving = true;
					Site.updateOrgSite(
						{
							'orgId': orgId,
							'site': $scope.usersSection.site
						},
						function(){
							reloadSites();
							reloadStudents();
						},
						function(error){
							$scope.error = error.error;
						}
					);
				}
			};
			$scope.calendarSection.save = function(isSite){
				$scope.calendarSection.saving=1
				if(!isSite){
					OrganizationV2.updateBlackoutDates(
						{
							id:$scope.organization.id,
							blackouts:$scope.organization.blackouts,
						},function(){
							$scope.calendarSection.saving=0
							$scope.calendarSection.cancel();
						},
						function(error){
							$scope.calendarSection.saving=2
							$scope.error = error.error;
						}
					)
				}
				else{
					Site.updateBlackoutDates(
						$scope.calendarSection.site,
						function(){
							$scope.calendarSection.saving=0
						},
						function(error){
							$scope.calendarSection.saving=2
							$scope.error = error.error;
						}
					)
				}


			}
			$scope.calendarSection.open = function(){
				if(!$scope.organization.blackouts){
					$scope.organization.blackouts = {
						blackouts:[],
						weekdays:[],
					}
				}
				$scope.blackouts = $scope.organization.blackouts;
				startWeekDaysModel();
				if($scope.$root.refreshDatepicker)
					$scope.$root.refreshDatepicker();
				$scope.calendarSection.busy = true;
			};
			$scope.calendarSection.greyOutDate = function(date){
				var d = date;

				if($scope.blackouts &&
					(	$scope.blackouts.blackouts.indexOf(dateToString(d))>=0 ||
						$scope.blackouts.weekdays.indexOf(d.getDay())>=0
					)
				){
					return [true,"ui-datepicker-blackout","Backout date"];
				}
				return [true,"",""];
			}
			$scope.calendarSection.checkModel = angular.copy(checkModelDefault);


			$scope.calendarSection.datePickerOptions = {
				beforeShowDay:$scope.calendarSection.greyOutDate,
				minDate:new Date(today.getFullYear(),0,1),
				maxDate:new Date(today.getFullYear()+1,11,31),
				numberOfMonths:[8,3],
				firstDay:0,
				onSelect: function(date) {
					$scope.calendarSection.toggleDate(date);
				}
			};


			$scope.calendarSection.cancel = function(){
				if($scope.calendarSection.site){
					$scope.blackouts = $scope.calendarSection.site.blackouts;
					startWeekDaysModel();
					$scope.$root.refreshDatepicker();
				}
				$scope.calendarSection.busy = false;
			};
			$scope.calendarSection.toggleDate = function(date){
				if(!$scope.blackouts) return;

				if(!$scope.blackouts.blackouts)
					$scope.blackouts.blackouts=[];
				var date = new Date(date);
				date.setTime(date.getTime() + date.getTimezoneOffset()*60*1000);
				//date.setHours(0,0,0,0);
				var index = $scope.blackouts.blackouts.indexOf(dateToString(date));
				if(index>=0){
					$scope.blackouts.blackouts.splice(index,1);
				}else{
					$scope.blackouts.blackouts.push(dateToString(date));
				}
				$scope.$root.refreshDatepicker();

			};
			$scope.$watch('calendarSection.site',function(site){
				if(!site) return;
				if(!site.blackouts){
					site.blackouts={
						blackouts:[],
						weekdays:[]
					}
				}
				$scope.blackouts = site.blackouts;
				startWeekDaysModel();
				$scope.$root.refreshDatepicker();
			});
			$scope.$watch('calendarSection.checkModel',function(checkModel){
				if(!($scope.organization && $scope.blackouts)){
					return;
				}
				$scope.blackouts.weekdays = [];
				for(var i in checkModel){
					if(checkModel[i]!==false){
						$scope.blackouts.weekdays.push(checkModel[i]);
					}
				}
				$scope.$root.refreshDatepicker();
			},true);

		}
	]
);

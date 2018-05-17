'use strict';

angular.module('app')

/* select/deselect assignments to be exempted for student.
 * Required:
 *   - if options.newPage == false: pageId (see /api/pages/{id}) OR assignmentId
 *   - classId
 *   - onSave (calback function -> receives list of exempt students)
 * Already exempt students are loaded automatically. Final changes are stored directly
 * using Assignment service.
 * If pages object is set, list is not loaded again
 */
.directive('exemptPages',
	[ 'Page',
		'Class',
		'Assignment',
		function(Page, Class, Assignment) {
			return {
				restrict: 'E',
				scope: {
					classId: '=',
					onSave: '=',
					studentId: '=?',
					userId: '=?',
					pages: '=?',
					exemptAssignments: '=?',
					options: '=?',
					credit:'=?'
				},
				templateUrl: '/public/views/directives/exemptpages.html?v='+ window.currentJsVersion,
				link: function ($scope, $element) {
					// to more quickly filter out pages already exempt
					var exemptIds = [];
					$scope.canSave = false;
					$scope.studentId = $scope.userId;
					$scope.credit = $scope.credit || false

					// define empty 'options' if undefined
					// options:
					//   - newPage (T/F)
					if(!$scope.options) {
						$scope.options = {};
					}

					// if list of pages already passed, no need to retrieve again
					if(!$scope.pages && !$scope.classId) {
						$scope.error = 'You must provide a valid classId or a list of pages';
					// retrieve list of students in class (based on classId)
					} else if(!$scope.pages) {
						$scope.classId = parseInt($scope.classId);
						Class.getAssignments(
							{id: $scope.classId},
							function(assignments) {
								$scope.pages = assignments;
							},
							function() {
								$scope.error = 'An error ocurred. Check the class id';
							}
						);
					}

					var fillExemptIds = function(exemptPages){
						angular.forEach(exemptPages, function(page){
							if(page.isPageGroup){
								var pageGroup = _.findWhere($scope.pages,{id:page.id});
								if(pageGroup){
									pageGroup.allPages = page.allPages;
									$scope.exempt(pageGroup);
								}
							}else{
								$scope.exempt(page);
							}
						});
					};

					var loadExemptPages = function(){
						if(!$scope.exemptPages) {
							Class.getExemptAssignmentsForUser(
								{
									id: $scope.classId,
									userId: $scope.studentId,
									credited:$scope.credit
								},
								function(exemptPages) {
									exemptPages = (exemptPages)? exemptPages: [];
									$scope.exemptPages = []
									fillExemptIds(exemptPages);
								},
								function() {
									$scope.error = 'An error ocurred. Check the student id';
								}
							);
						}
					};

					// new page?
					if($scope.exemptAssignments) {
						fillExemptIds($scope.exemptAssignments);
					} else if($scope.options.newPage) {
						$scope.exemptPages = [];
					// get exemptStudents in assignment
					}

					$scope.exempt = function(page){
						// also add id to list of id's
						if(!$scope.isExempt(page)) {
							if(page.isPageGroup)
								exemptGroup(page);
							else
								exemptPage(page);

							$scope.canSave = true;
						}
					};
					function exemptGroup(group){
						_.each(group.pages,function(p) {
							if ($scope.isExempt(p))
								$scope.unexempt(p);
						});

						var groupWithoutPages = angular.copy(group);
						groupWithoutPages.pages = [];

						$scope.exemptPages.push(groupWithoutPages);

						exemptIds.push(group.id);

						_.each(group.pages,function(p){
							exemptPage(p)
						})

					}
					function exemptPage(page){
						if(page.pageGroupId){
							if(isGroupExempt(page)){
								var exemptGroupIndex = getGroupExemptIndex(page.pageGroupId);
								if(exemptGroupIndex>=0)
									$scope.exemptPages[exemptGroupIndex].pages.push(page);
							}
							else{
								$scope.exemptPages.push(page);

							}
						}else{
							$scope.exemptPages.push(page);
						}
						exemptIds.push(page.id);
					}
					function getGroupExemptIndex(groupId){
						return _.findIndex($scope.exemptPages,function(g){
							return g.id == groupId;
						})
					}

					$scope.unexempt = function(page){
						// remove from id's list and actual list
						if($scope.isExempt(page)) {
							if(page.isPageGroup){
								while(page.pages.length>0){
									unexemptPage(page.pages[0]);
								}
							}
							unexemptPage(page);
							$scope.canSave = true;
						}
					};
					function unexemptPage(page){
						exemptIds.splice(exemptIds.indexOf(page.id), 1);
						if(isGroupExempt(page)){
							var exemptGroupIndex = getGroupExemptIndex(page.pageGroupId);
							if(exemptGroupIndex>=0){
								var pages = $scope.exemptPages[exemptGroupIndex].pages;
								pages.splice(pages.indexOf(page),1);
							}
						}else{
							var index = _.findIndex($scope.exemptPages,function(p){return p.id ==page.id});
							if(index>=0)
								$scope.exemptPages.splice(index,1);
						}

					}

					$scope.isExempt = function(page){
						return (exemptIds.indexOf(page.id) !== -1);
					};
					function isGroupExempt(page){
						return exemptIds.indexOf(page.pageGroupId) !== -1
					}

					$scope.exemptAll = function(){
						angular.forEach($scope.pages, function(pages){
							$scope.exempt(pages);
						});
						$scope.canSave = true;
					};

					$scope.unexemptAll = function(){
						$scope.exemptPages = [];
						exemptIds = [];
						$scope.canSave = true;
					};

					$scope.save = function(){
						$scope.canSave = false;
						$scope.saving = true;
						if(!$scope.options.newPage) {
							$scope.savingExempt = true;
							Class.updateExemptPages(
								{
									id: $scope.classId,
									userId: $scope.studentId,
									pages: $scope.exemptPages,
									credited:$scope.credit

								},
								function(){
									$scope.onSave($scope.exemptPages);
									delete $scope.saving;
								},
								function(){
									$scope.error = 'Could not update list of exempt students, please close this modal and try again';
									delete $scope.saving;
								}
							);
						} else {
							$scope.onSave($scope.exemptPages);
							delete $scope.saving;
						}
					};
					$scope.stopPropagation = function(evt){
						evt.stopPropagation();
					}
					$scope.$watch('pages',function(pages){
						if(pages){
							loadExemptPages();
						}
					})
				}
			};
		}
	]
);

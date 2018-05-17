'use strict';

angular.module('app')

/* select/deselect students to be exempted from class assignment.
 * Required:
 *   - if options.newPage == false: pageId (see /api/pages/{id}) OR assignmentId
 *   - classId
 *   - onSave (calback function -> receives list of exempt students)
 * Already exempt students are loaded automatically. Final changes are stored directly
 * using Assignment service.
 * If students object is set, list is not loaded again (see /classes/{classId}/assignments/{assignmentId}/exempts)
 */
.directive('exemptStudents',
	[ 'Page',
		'Class',
		'Assignment',
		function(Page, Class, Assignment) {
			return {
				restrict: 'E',
				scope: {
					classId: '=',
					onSave: '=',
					pageId: '=?',
					assignmentId: '=?',
					students: '=?',
					exemptUsers: '=?',
					options: '=?',
					credit:'=?'
				},
				templateUrl: '/public/views/directives/exemptstudents.html',
				link: function ($scope, $element) {
					// to more quickly filter out students already exempt
					var exemptIds = [];
					$scope.canSave = false;
					$scope.credit = $scope.credit || false;

					// define empty 'options' if undefined
					// options:
					//   - newPage (T/F)
					if(!$scope.options) {
						$scope.options = {};
					}

					// if list of students already passed, no need to retrieve again
					if(!$scope.students && !$scope.classId) {
						$scope.error = 'You must provide a valid classId or a list of students';
					// retrieve list of students in class (based on classId)
					} else if(!$scope.students) {
						$scope.classId = parseInt($scope.classId);
						Class.getStudents(
							{id: $scope.classId},
							function(users) {
								$scope.students = users.students;
							},
							function() {
								$scope.error = 'An error ocurred. Check the class id';
							}
						);
					}

					var fillExemptIds = function(){
						angular.forEach($scope.exemptStudents, function(student){
							exemptIds.push(student.id);
						});
					};

					var loadExemptStudents = function(){
						if(!$scope.exemptUsers) {
							Assignment.getExemptStudents(
								{
									classId: $scope.classId,
									assignmentId: $scope.assignmentId,
									credited:$scope.credit
								},
								function(exemptStudents) {
									$scope.exemptStudents = (exemptStudents.students)? exemptStudents.students : [];
									fillExemptIds();
								},
								function() {
									$scope.error = 'An error ocurred. Check the assignment id';
								}
							);
						}
					};

					// new page?
					if($scope.exemptUsers) {
						$scope.exemptStudents = $scope.exemptUsers;
						fillExemptIds();
					} else if($scope.options.newPage) {
						$scope.exemptStudents = [];
					// get exemptStudents in assignment
					} else {
						// if pageId present, load assignmentId from page
						if($scope.pageId) {
							Page.get(
								{id:$scope.pageId},
								function(page) {
									$scope.assignmentId = page.assignmentId;
									loadExemptStudents();
								}
							);
						// assignmentId is mandatory if no pageId
						} else if(!$scope.assignmentId) {
							$scope.error = 'You must provide an assignmentId or a pageId';
						} else {
							$scope.assignmentId = parseInt($scope.assignmentId);
							loadExemptStudents();
						}
					}

					$scope.exempt = function(student){
						// also add id to list of id's
						if(!$scope.isExempt(student)) {
							exemptIds.push(student.id);
							$scope.exemptStudents.push(student);
							$scope.canSave = true;
						}
					};

					$scope.unexempt = function(student){
						// remove from id's list and actual list
						if($scope.isExempt(student)) {
							exemptIds.splice(exemptIds.indexOf(student.id), 1);
							$scope.exemptStudents.splice($scope.exemptStudents.indexOf(student),1);
							$scope.canSave = true;
						}
					};

					$scope.isExempt = function(student){
						return (exemptIds.indexOf(student.id) !== -1);
					};

					$scope.exemptAll = function(){
						angular.forEach($scope.students, function(student){
							$scope.exempt(student);
						});
						$scope.canSave = true;
					};

					$scope.unexemptAll = function(){
						$scope.exemptStudents = [];
						exemptIds = [];
						$scope.canSave = true;
					};

					$scope.save = function(){
						$scope.canSave = false;
						$scope.saving = true;
						if(!$scope.options.newPage) {
							$scope.savingExempt = true;
							Assignment.updateExempt(
								{
									classId: $scope.classId,
									assignmentId: $scope.assignmentId,
									students: $scope.exemptStudents,
									credited:$scope.credit },
								function(){
									$scope.onSave($scope.exemptStudents);
									delete $scope.saving;
								},
								function(){
									$scope.error = 'Could not update list of exempt students, please close this modal and try again';
									delete $scope.saving;
								}
							);
						} else {
							$scope.onSave($scope.exemptStudents);
							delete $scope.saving;
						}
					};
				}
			};
		}
	]
);

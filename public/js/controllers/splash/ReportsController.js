'use strict';
angular.module('app')
.controller(
	'ReportsController',
	[	'$scope',
		'Report',
		'UserV2',
		'OrganizationV2',
		function($scope, Report,UserV2,OrganizationV2){
			$scope.type = null;
			$scope.reportService = Report;
			$scope.reports={}
			$scope.selected={};
			$scope.loadingData = {};
			$scope.$root.selected={};

			$scope.$watch('selected.teacher',changeTeacher);
			UserV2.getUser().then(function(me){
				$scope.me=me;
				$scope.$root.me=me;
				getTeachers();
			});
			Report.getEnabled($scope.$root.user.org.id,function(reports){
				$scope.enabledReports = reports;
			},$scope.loadingData);
			$scope.amIAdmin = function(){
				return $scope.me && ($scope.me.isSuperAdmin || $scope.me.privileges.length);
			}
			$scope.getAdvisees = function(){
				if(!$scope.me) return;
				return $scope.me.advisees.length;
			}

			$scope.getClasses = function(){
				if(!$scope.me) return;
				return $scope.me.classes.length;
			}
			$scope.selectReport = function(report){
				$scope.type = report;
				if(report=='all_courses' && !$scope.reports.allCourses)
					getCoursesReport()
			}
			function getCoursesReport(teacher){
				$scope.loading = true;
				var params;
				if(teacher){
					var classes = []
					_.each(teacher.classes,function(c){
						if(c.is_teacher==1)
							classes.push(c.id);
					})
					params = {
						classes:JSON.stringify(classes)
					}
				}
				Report.retrieve('class-summary',params).then(
					function(report){
						$scope.reports.allCourses={};
						$scope.reports.allCourses.rows = report;
						$scope.reports.allCourses.header=[
							{id:'name',label:"Name"},
							{id:'studentCount',label:"Active students"},
							{id:'unitConut',label:"Units"},
							{id:'lessonCount',label:"Lessons"},
							{id:'submittableCount',label:"Submittable assignments"},
							{id:'needingGrade',label:"Grading queue"},
						]
						$scope.loading = false;
					},
					function(error){
						$scope.loading = false;
						$scope.error = error;
					}
				);
			}

			// alerts: reports 1,2,3,4
			$scope.selectAlerts = function(){
				$scope.type = 'alerts';
				$scope.loading = true;
				$scope.alerts = {
					'1':{
						id:'1',
						title:'Grades below C (N/A yet)',
						show:false,
						'class':'panel-warning'
					},
					'2':{
						id:'2',
						title:'+15% behind',
						show:false,
						'class':'panel-info'
					},
					'4':{
						id:'4',
						title:'Missing 3 assignments',
						show:false,
						'class':'panel-info'
					},
				};
				// Report.retrieve(1).then(
				// 	function(report){
				// 		var rows=[];
				// 		for(var i in report.students){
				// 			var student =report.students[i];
				// 			for(var j in student.classes){
                //
				// 				var class_ = student.classes[j];
				// 				if(!class_.grades.length) continue;
				// 				var last_grade = class_.grades[0];
                //
				// 				var trend=class_.grades.length>1?parseInt((last_grade.gradePercent/class_.grades[1].gradePercent-1)*100)+'%':'-';
				// 				rows.push({
				// 					'name':student.name,
				// 					'className':class_.name,
				// 					'gradePercent':last_grade.gradePercent,
				// 					'trend':trend,
				// 					'studentId':student.id,
				// 					'classId':class_.id,
				// 					'dateWhenDropped':class_.dateWhenDropped
				// 				})
				// 			}
				// 		}
				// 		report.rows=rows;
				// 		$scope.alerts[1]=angular.extend($scope.alerts[1],report);
				// 		$scope.alerts[1].header = getBellowCHeader();
                //
				// 		$scope.loading = false;
				// 	},
				// 	function(error){
				// 		$scope.loading = false;
				// 		$scope.error = error;
				// 	}
				// );
				// Report.retrieve(2).then(
				// 	function(report){
				// 		var rows=[];
				// 		for(var i in report.students){
				// 			var student =report.students[i];
				// 			for(var j in student.classes){
				// 				var class_ = student.classes[j];
				// 				rows.push({
				// 					'name':student.name,
				// 					'className':class_.name,
				// 					'percBehind':class_.percBehind,
				// 					'lastTimeWorked':class_.lastTimeWorked
				// 				})
				// 			}
				// 		}
				// 		report.rows=rows;
				// 		$scope.alerts[2]=angular.extend($scope.alerts[2],report);
				// 		$scope.loading = false;
				// 	},
				// 	function(error){
				// 		$scope.loading = false;
				// 		$scope.error = error;
				// 	}
				// );
				// Report.retrieve(3).then(
				// 	function(report){
				// 		report.rows= _.map(report.students,function(obj){return obj});
				// 		$scope.alerts[3]=angular.extend($scope.alerts[3],report);
				// 		$scope.loading = false;
				// 	},
				// 	function(error){
				// 		$scope.loading = false;
				// 		$scope.error = error;
				// 	}
				// );
				// Report.retrieve(4).then(
				// 	function(report){
				// 		var rows=[];
				// 		for(var i in report.students){
				// 			var student =report.students[i];
				// 			for(var j in student.classes){
				// 				var class_ = student.classes[j];
				// 				rows.push({
				// 					'name':student.name,
				// 					'className':class_.name,
				// 					'missingTasks':class_.missingTasks,
				// 					'expectedTasks':class_.expectedTasks
				// 				})
				// 			}
				// 		}
				// 		report.rows=rows;
				// 		$scope.alerts[4]=angular.extend($scope.alerts[4],report);
				// 		$scope.loading = false;
				// 	},
				// 	function(error){
				// 		$scope.loading = false;
				// 		$scope.error = error;
				// 	}
				// );
			};
			function showGraph(data){
				if($scope.alerts[1].graph &&
					$scope.alerts[1].graph.studentId==data.studentId&&
					$scope.alerts[1].graph.classId==data.classId
				) {
					/*
						We are hiding the graph
					 */
					delete $scope.alerts[1].graph;
					return;
				}
				
				var grades = $scope.alerts[1].students[data.studentId].classes[data.classId].grades;
				$scope.alerts[1].graph={
					'studentId':data.studentId,
					'classId':data.classId,
					'data': [_.map(grades,function(g){return g.gradePercent}).reverse()],
					'labels': _.map(grades,function(g){return formatDate(g.date) }).reverse(),
				};


			}
			function formatDate(date){
				return date?moment(date).format("MM/DD/YYYY"):''
			}
			function getBellowCHeader(){
				return [
					{'id':'name','label':'Student'},
					{'id':'className','label':'Class'},
					{'id':'gradePercent','label':'Grade (%)'},
					{'id':'dateWhenDroppend',functions:{formatDate:formatDate},'label':'Date when dropped',rowTemplate:'{{functions.formatDate(data.dateWhenDropped)}}'},
					{'id':'icon','label':'',functions:{showGraph:showGraph},rowTemplate:'<span class="fa fa-area-chart pointer" ng-click="functions.showGraph(data)"></span>'},
					{'id':'trend','label':'Trend'},


				]
			}
			function changeTeacher(teacher){
				$scope.$root.selected.teacher=teacher;
				getCoursesReport(teacher)
			}
			function getTeachers(){
				if(!$scope.amIAdmin()) return;
				$scope.loadingTeachers = true;
				OrganizationV2.getUsers({
					id:$scope.me.orgId,
					asTeacher:true,
					includeClasses:true
				},function(teachers){
					$scope.loadingTeachers = false;
					$scope.$root.teachers=_.map(teachers,function(t){
						t.name = $scope.$root.prepareUserName($scope.$root.user.org.sort_users_by,t.firstName,t.lastName)
						return t;
					});

				},function(error){
					$scope.loadingTeachers = false;
					$scope.error = error.error;
				});
			}

		}
	]
);

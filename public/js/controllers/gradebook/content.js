'use strict';

angular.module('app')
.controller('GradebookContentController',
	[	'$scope',
		'$stateParams',
		'$q',
		'$timeout',
		'$location',
		'$window',
		'$modal',
		'$filter',
		'Assignment',
		'EditOrganizationUser', // need it because 'User' resource does not work correctly
		'EditCourseClass', // need it because 'Course' cannot search by take courseId
		'Gradebook',
		'Class',
		'loadingCell',
		'HelperService',
		function($scope, $stateParams, $q, $timeout,$location,$window, $modal,$filter, Assignment, EditOrganizationUser, EditCourseClass, Gradebook,Class,loadingCell,HelperService){
			$scope.loadingCell = loadingCell
			$scope.menu = {}; // holder for menu functions
			$scope.filters = {};
			$scope.showPercentage = true;
			$scope.limit = 70 //hardcoding limit of the pagination
			$scope.page= 1;
			$scope.collapaseTotals = {
				expand_url:'/public/img/expand-menu-icon.png',
				collapse_url:'/public/img/collapse-menu-icon.png',
				collapsed: $(window).width()<768?true:false
			}
			var initialUserTypes = [
				{
					'id':'active',
					'label': 'Show active students'
				},
				{
					'id':'all',
					'label': 'Show all students'
				},
				{
					'id':'removed',
					'label': 'Show archived students'
				}
			]
			$scope.data={
				classId:$stateParams.classId,
				gradebookLeft:0,
				gradebookTop:0,
				showUsersTypes: _.clone(initialUserTypes)
			};

			$scope.limits={
				pages:{
					start:0,
					to:1,
					currentPage:0
				},
				students:{
					start:0,
					to:0,
					currentPage:0
				},
			}
			$scope.showGroup = 1;
			$scope.studentFilter = {};	// for filter by last name (user input)
			$scope.units = null;	// for grouped results
			$scope.students = {0: [], 1: [], 2: [], 3: [], 4: [], 5: []};	// for grouped results
			$scope.classId = $stateParams.classId;
			$scope.$root.updateDisplayedCells = updateDisplayedCells
			var classData = {};	// general attributes of loaded class
			var maxByDefault = 50;	// auto group if more than this number

			getClasses();

			$scope.loadingText = 'Checking parameters...';
			if($stateParams.classId) {
				$scope.loadingText = 'Determining class size...';
				$scope.data.showUsersTypes =  _.clone(initialUserTypes);
				Gradebook.getClass($stateParams.classId).then(
					function(classInfo){
						classData = classInfo;

						$scope.$root.classInfo = classInfo;
						$scope.courseName = classInfo.name;
						if($scope.showGroupIcons()) {
							$scope.groupBy(1);
						} else {
							$scope.groupBy(null);
						}
					},
					function(){
						$scope.error = 'ERROR: You must be a teacher in this class or an admin';
					}
				);
			}
			function prepareNumberOfStudents(classInfo){
                $scope.data.showUsersTypes =  angular.copy(initialUserTypes);
				_.find($scope.data.showUsersTypes,{id:'active'}).label += ' (' + classInfo.activeStudentsCount + ')';
				_.find($scope.data.showUsersTypes,{id:'all'}).label += ' (' + classInfo.totalStudentsCount + ')';
				_.find($scope.data.showUsersTypes,{id:'removed'}).label += ' (' + classInfo.inactiveStudentsCount + ')';
			}
			function prepareCategoriesCount(classInfo){
				$scope.uncategorized = {count:0};
				$scope.useCategories = classInfo.useCategories;
				$scope.enableCreditedAssignments = classInfo.enableCreditedAssignments;
				if(!$scope.useCategories) return;
				_.each(classInfo.units,function(unit){
					_.each(unit.pagegroups,function(pg){
						_.each(pg.pages,function(page){
							if(!page.category_id){
								$scope.uncategorized.count++;
							}
						})
					})
				})
			}
			function getClasses(){
				Class.query({
					as: 'teacher'
				},function(classes){

					$scope.data.classes= _.map($filter('orderBy')(classes,'name'),function(c){
						c.id = c.groupId? c.id + '-' + c.groupId: c.id
						return c
					});
				});
			}
			$scope.getClasses = getClasses;
			$scope.openRubric = function(page){
				var modalInstance = $modal.open({
					templateUrl: '/public/views/partials/student/rubric-modal.html',
					controller: 'RubricStudentController',
					resolve:{
						data:function(){
							return {
								pageid:page.id,
								rubricid:page.rubricId,
							}
						}
					}

				});
			}
			$scope.$watch('data.showUsersType',changeShowUsers);
			$scope.data.showUsersType='active';

			function changeShowUsers(type){
				if(!type) return;
				var promise;
				if(type!='active'){
					promise = loadRemovedStudentsIfNeeded(true)
				}else{
					reloadGrades();
					promise = $q.defer();
					promise.resolve();
					promise = promise.promise
				}
				promise.then(function(){

					recalculateAverages()
				})

			}
			function loadRemovedStudentsIfNeeded(force){
				var defer = $q.defer()
				if($scope.students.removed && !force)
					defer.resolve()
				else{
					$scope.loading = true
					var allStudents = $scope.data.showUsersType == 'all';
					Gradebook.getCachedClassGrades({
						classId:$stateParams.classId,onlyRemoved:allStudents?0:1,includeInactive:allStudents?1:0,page:$scope.page,limit:$scope.limit,term:$scope.filters.student
					}, function(result){
						$scope.loading = false;
                        updatePagination(result);
                        if(allStudents)
                            $scope.students.all = prepareStudents(result.students);
                        else
                            $scope.students.removed = prepareStudents(result.students);
                        updateCurrentStudents($scope.data.showUsersType);
						defer.resolve()
					});
				}
				return defer.promise;
			}
			function prepareStudents(students){
				students = $filter('orderBy')(students,'lastName');
				_.each(students,function(s,i){
					s.name = s.firstName + ' ' + s.lastName;
					s.pos = i;
				})
				return students;
			}
			function updateCurrentStudents(type){
				switch (type){
					case 'active':
						$scope.students[$scope.currentGroup]=$scope.students.active
						break;
					case 'all':
						if(!$scope.students.all){
							$scope.students.all = $filter('orderBy')($scope.students.active.concat($scope.students.removed),'fname')
						}
						$scope.students[$scope.currentGroup]= $scope.students.all;
						break;
					case 'removed':
						$scope.students[$scope.currentGroup]=$scope.students.removed;
						break;
					default:
						return;
				}
				reloadLazyLoadPages($scope.students[$scope.currentGroup]);
				updateDisplayedCells($scope.lastReloadScrollTop)
				$scope.reloadVisiblePages($scope.lastReloadScroll);

			}
			$scope.showAverageHistory = function(){
				return $scope.data.showUsersType != 'all';
			}
			$scope.collapseUrl = function(){
				return $scope.collapaseTotals.collapsed?$scope.collapaseTotals.collapse_url:$scope.collapaseTotals.expand_url;
			}
			$scope.toogleCollapse = function(){
				$scope.collapaseTotals.collapsed = !$scope.collapaseTotals.collapsed;
			}
            function mobileUi() {
                if($(window).width()<768){
                	var scrollTop = document.body.scrollTop;
                	$(".gradebook-menu").css("cssText", "margin-top: 10px !important");
					if (window.matchMedia("(orientation: portrait)").matches) {
						$(".gradebook-body").css("cssText", "top: 253px !important");
					}else{
						$(".gradebook-body").css("cssText", "top: 226px !important");
					}
                }
            }
            mobileUi();
            window.addEventListener("orientationchange",mobileUi);
			$scope.downloadCsv = function(){
				$scope.gradebook = {downloading:true};
				Class.downloadGradebook({
					getData:true,
					id:$stateParams.classId,
				},function(response){
					$scope.gradebook.downloading = false;
					HelperService.buildFileFromData(response.content,response.filename);
				})
			}
			$scope.openModal = function(type, params) {
				var types = {
					student: {
						controller: 'GradebookModalStudentController',
						size: 'lg',
						view: 'student.html'
					},
					grade: {
						controller: 'GradebookModalGradeController',
						size: 'md',
						view: 'grade.html'
					},
					title: {
						controller: 'GradebookModalTitleController',
						size: 'lg',
						view: 'title.html'
					},
					durations: {
						controller: 'GradebookModalDurationsController',
						size: 'lg',
						view: 'durations.html?v='+window.currentJsVersion
					},
					categories: {
						controller: 'GradebookModalCategoriesController',
						size: 'lg',
						windowClass:'gradebook-categories-modal',
						view: 'categories.html?v='+window.currentJsVersion
					}
				};
				$modal.open({
					templateUrl: '/public/views/gradebook/modals/' + types[type].view,
					controller: types[type].controller,
					size: types[type].size,
					windowClass:types[type].windowClass,
					resolve: {
						params: function () {
							return params;
						}
					}
				});
			};

			$scope.showGroupIcons = function(){
				return classData.studentCount > maxByDefault;
			};

			$scope.getFinalGrade = function(finalGrade){
				if(finalGrade === null) {
					return '-';
				}
				return finalGrade;
			};

			$scope.saveScore = function(page,student){
				if(!page.oldScore) page.oldScore = null;
				if (page.typingTimeout) $timeout.cancel(page.typingTimeout);
				var tmpTimeOut = toastr.options.timeOut;

				page.typingTimeout = $timeout(function() {
					toastr.options.timeOut=1000;
					toastr.success('Saving score for ' + student.lastName)
					page.show=false;
					student.savingScore = true;
					Gradebook.cancelRequests();
					Gradebook.overrideScore(
						$stateParams.classId,
						page.id,
						student.id,
						page.score
					).then(function(progressReport){
							student.savingScore = false;
							_.extend(student,progressReport);
							//updateSummary(student,page);
						});
				}, 1000);

			}
			$scope.getScore = function(assignment){
				if(assignment.isScoreOverride) {
					return ($scope.hasScore(assignment))? assignment.score + '*' : '0' ;
				}
			return ($scope.hasScore(assignment))? assignment.score : '0';
			};
			function findUnitPage(pageId){
				for(var u=0;u<$scope.units.length;u++){
					for(var pg=0;pg<$scope.units[u]['pagegroups'].length;pg++) {
						for(var p=0;p<$scope.units[u]['pagegroups'][pg]['pages'].length;p++) {
							if($scope.units[u]['pagegroups'][pg]['pages'][p].id==pageId)
								return $scope.units[u]['pagegroups'][pg]['pages'][p];
						}
					}
				}
			}
			function updateSummary(student,page){


				student.totalScore = parseFloat(student.totalScore) + (parseFloat(page.score==""?0:page.score) - parseFloat(page.oldScore?page.oldScore:0));

				var unitPage = findUnitPage(page.id);
				unitPage.averagePoints = unitPage.averagePoints||0;
				unitPage.historical_avg_score = unitPage.historical_avg_score||0;
				unitPage.gradedStudents = unitPage.gradedStudents||0;
				unitPage.historical_avg_studentCount = unitPage.historical_avg_studentCount||0;

				if(page.score=='' && page.oldScore){
					student.percCompletedTasks = parseInt((parseInt(--student.completedTasks))*100/parseInt(student.totalTasks))
					student.totalWorkedScore = parseFloat(student.totalWorkedScore) - (parseFloat(page.maxScore));
					unitPage.averagePoints = Number(((unitPage.averagePoints*unitPage.gradedStudents - parseFloat(page.oldScore))/(--unitPage.gradedStudents)).toFixed(2));
					unitPage.historical_avg_score = Number(((unitPage.historical_avg_score*unitPage.historical_avg_studentCount - parseFloat(page.oldScore))/(--unitPage.historical_avg_studentCount)).toFixed(2));
				}
				else if(page.oldScore===null || page.oldScore===''){
					student.percCompletedTasks = parseInt((parseInt(++student.completedTasks))*100/parseInt(student.totalTasks))
					student.totalWorkedScore = parseFloat(student.totalWorkedScore) + (parseFloat(page.maxScore));
					unitPage.averagePoints = Number(((unitPage.averagePoints*unitPage.gradedStudents + parseFloat(page.score==""?0:page.score))/(++unitPage.gradedStudents)).toFixed(2));
					unitPage.historical_avg_score = Number(((unitPage.historical_avg_score*unitPage.historical_avg_studentCount + parseFloat(page.score==""?0:page.score))/(++unitPage.historical_avg_studentCount)).toFixed(2));
				}else{
					unitPage.averagePoints = Number(((unitPage.averagePoints*unitPage.gradedStudents + (parseFloat(page.score==""?0:page.score) - parseFloat(page.oldScore)))/(unitPage.gradedStudents)).toFixed(2));
					unitPage.historical_avg_score = Number(((unitPage.historical_avg_score*unitPage.historical_avg_studentCount + (parseFloat(page.score==""?0:page.score) - parseFloat(page.oldScore)))/(unitPage.historical_avg_studentCount)).toFixed(2));
				}

				student.percCompletedScore = student.totalWorkedScore?(student.totalScore*100/parseFloat(student.totalWorkedScore)).toFixed(2):0;
				student.percTotalScore = (student.totalScore*100/parseFloat(student.totalMaxScore)).toFixed(2);



				page.oldScore=page.score;
			}
			function clearAverages(){
				for(var unitId in $scope.indexedPages){
					for(var pgId in $scope.indexedPages[unitId]){
						for(var pId in $scope.indexedPages[unitId][pgId]){
							delete $scope.indexedPages[unitId][pgId][pId].averagePoints;
						}
					}
				}
			}
			function recalculateAverages(){
				clearAverages()
				_.each($scope.allPageScores,function(page,id){
					var avg  = _.reduce(page.scores, function(memo, num) {
						return memo + Number(num);
					}, 0) / (page.scores.length === 0 ? 1 : page.scores.length);
					$scope.indexedPages[page.unitId][page.pgId][id].averagePoints = Number(avg.toFixed(2));
				})
			}

			// classDetails.rubric contains mins for each letter
			$scope.getLetterScore = function(score, maxScore){
				// to avoid division by 0
				if(!maxScore){
					return '-';
				}
				// in this case, totalScore is a scalar representing a percentage
				var totalScore = parseInt((score * 100) / maxScore);
				var gradeLetter, found;
				angular.forEach(classData.rubric, function(letter){
					if(found) {
						return;
					}
					if(letter.use && totalScore >= letter.min) {
						gradeLetter = letter.gradeLetter;
						found = true;
					}
				});
				return gradeLetter;
			};

			$scope.showScoreGrades = function(){
				return (classData && classData.showGrades)?  classData.showGrades.score : false;
			};

			$scope.showLetterGrades = function(){
				return (classData && classData.showGrades)?  classData.showGrades.letter : false;
			};

			$scope.showPercentageGrades = function(){
				return (classData && classData.showGrades)?  classData.showGrades.percentage : false;
			};

			$scope.showFinalGrade = function(){
				return (classData)?  classData.showFinalGrade : false;
			};

			$scope.getRightColumnWidth = function(number){
				if($scope.collapaseTotals.collapsed) return number?15:15 + 'px';
                if($(window).width()< 768) return number?'15':'70%';
				var max = 80;
				max += ($scope.showScoreGrades())? 160 : 0;
				max += ($scope.showLetterGrades())? 80 : 0;
				max += ($scope.showPercentageGrades())? 160 : 0;
				max += ($scope.showFinalGrade())? 80 : 0;
				return number?max:max + 'px';
			};

			$scope.hasScore = function(assignment){
				return (assignment.score !== null)? assignment.score : false;
			};
			function reloadScrollSettings(){
				var gradebookHeight = $window.innerHeight - 175;
				var gradebookWidth = $window.innerWidth - 200 - $scope.getRightColumnWidth(true) -15;
				$scope.limits.students.gradebookHeight =  gradebookHeight;
				$scope.limits.students.perPage =  Math.max(Math.ceil(gradebookHeight/34),10);
				$scope.limits.students.to = gradebookHeight/34;


				$scope.limits.pages.gradebookWidth = gradebookWidth;
				$scope.limits.pages.start = 0;
				$scope.limits.pages.to = parseInt(gradebookWidth/100);
				$scope.reloadVisiblePages(0)
				$scope.updateDisplayedCells(true);


			}
			function reloadLazyLoadPages(students){
				var j = 0;
				$scope.allPageScores = {}
				angular.forEach(students,function(student){
					var i = 0;

					student.pos=j++;
					var pgCount = 0;
					angular.forEach(student.units,function(unit){
						var totalPages = 0;

						angular.forEach(unit.pagegroups,function(pg){
							pg.width=pg.pages.length*100;
							pg.pos = ++pgCount;
							angular.forEach(pg.pages,function(page){
								if(page.score)
									addPageScores(page,pg.id,unit.id);
								page.pos = i++;
								totalPages++;
							})
						})
						unit.width=totalPages*100;
					})
				})
				function addPageScores(page,pgId,unitId){
					if(page.isExempt) return;
					$scope.allPageScores[page.id] = $scope.allPageScores[page.id] || {
							scores: [],
							pgId:pgId,
							unitId:unitId
						}
					$scope.allPageScores[page.id].scores.push(page.score)
				}

			}
			function addToIndexedPages(page,unitId,pgId){
				$scope.indexedPages[unitId] = $scope.indexedPages[unitId] || {}
				$scope.indexedPages[unitId][pgId] = $scope.indexedPages[unitId][pgId] || {}
				$scope.indexedPages[unitId][pgId][page.id] = page;
			}
            $scope.prevPage = function(){
                $scope.page = Math.max(1,$scope.page-1);
                reloadGrades()
            };
            $scope.nextPage = function(){
                $scope.page = Math.min($scope.totalPages,$scope.page+1);
                reloadGrades()
            };
            function reloadGrades(){
                if($scope.data.showUsersType == 'active')
                    loadGrades();
                else
                    loadRemovedStudentsIfNeeded(true);

			}
            var searchTimeout;
            $scope.onSearchKeyUp = function(){
                searchTimeout && clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function(){
                    loadGrades()
                },500)
            };
            function updatePagination(result){
                $scope.page = parseInt(result.page);
                $scope.maxShown = Math.min($scope.page*$scope.limit,result.total);
                $scope.total = result.total;
                $scope.totalPages = result.totalPages;
			}
			function setGrades(result){
                updatePagination(result);
				result.students = prepareStudents(result.students);
				prepareNumberOfStudents(result);
				prepareCategoriesCount(result)
				$scope.data.totalPages = 0;
				$scope.indexedPages = {};
				if(result.units){
					var i = 0;
					var pgCount = 0;
					angular.forEach(result.units,function(unit){
						var totalPages = 0;
						angular.forEach(unit.pagegroups,function(pg){
							pg.width=pg.pages.length*100;
							pg.pos = ++pgCount;
							angular.forEach(pg.pages,function(page){
								page.pos = i++;
								totalPages++;
								addToIndexedPages(page,unit.id,pg.id)

							})
						})
						unit.width=totalPages*100;
						$scope.data.totalPages+=totalPages;
					})
				}

				if(result.students){
					reloadLazyLoadPages(result.students)
				}



				if(!result) {
					$scope.error = 'ERROR: Class not found or you have no access to it as a teacher';
					return;
				}
				if(!result.students) {
					$scope.error = 'Class has no content or no users';
					return;
				}
				// $scope.units will render headers
				if(!$scope.units) {
					$scope.loadingText = 'Loading units...';
					$scope.units = result.units;
				}
				$scope.loadingText = 'Rendering data...';
				$scope.students.active = result.students;
				$scope.students[$scope.currentGroup] = result.students;
				$scope.showGroup = $scope.currentGroup;
				reloadScrollSettings();
				$scope.loading = false;

			}
			function loadGrades(){
                if($scope.loading && $scope.data.showUsersType=='active') return;
                $scope.loading = true;
                $scope.loadingText = 'Retrieving class data...';

				Gradebook.getCachedClassGrades({
					classId:$stateParams.classId,forceCalculation:true,calculateAverage:$scope.page==1?1:0,page:$scope.page,limit:$scope.limit,term:$scope.filters.student
				}, setGrades);
			}
			$scope.groupBy = function(group){
				$scope.loading = true;
				var from, to;
				switch(group) {
					case 1:
						from = 'a';
						to = 'e';
						break;
					case 2:
						from = 'f';
						to = 'j';
						break;
					case 3:
						from = 'k';
						to = 'o';
						break;
					case 4:
						from = 'p';
						to = 't';
						break;
					case 5:
						from = 'u';
						to = 'z';
						break;
					default:
						group = 0;
						break;
				}
				if(!$scope.students[group].length) {
					$scope.currentGroup = group;
					loadGrades();
				} else {
					if(group === $scope.showGroup) {
						$scope.loading = false;
						return;
					}
					$scope.loadingText = 'Rendering data...';
					// timeout needed to allow for loading screen
					$timeout(function(){
						$scope.showGroup = group;
						$scope.loading = false;
					});
				}
			};

			var scroll = function(direction){
				var elm1 = document.getElementById('gradebook-grades-header');
				var elm2 = document.getElementById('gradebook-grades-body');
				var offset = elm1.offsetWidth - 50;
				if(direction === 'left') {
					elm1.scrollLeft -= offset;
					elm2.scrollLeft -= offset;
				} else {
					elm1.scrollLeft += offset;
					elm2.scrollLeft += offset;
				}
			};

			$scope.recalculateGrades = function(){
				$scope.loadingText = 'Recalculating class data...';
				$scope.loading = true;
				Gradebook.recalculateGrades({
					classId:$scope.classId
				},function(){
					location.reload();
				});
			};

			$scope.scrollLeft = function(){
				scroll('left');
			};
			$scope.scrollRight = function(){
				scroll('right');
			};

			$scope.$watch('data.classId',function(id){
				if(id && id!= $stateParams.classId){
					$location.path('/gradebook/'+id);
				}
			})

			$scope.$watch(gradebookArea,function(){
				var gbBody = angular.element('#gradebook-body');
				var width=$window.innerWidth - parseInt($scope.getRightColumnWidth().substring(0, $scope.getRightColumnWidth().length - 2)) -200,
					height=gbBody.height(),
					left = 200,
					top = gbBody.offset().top,
					bottom = top+height,
					right = left+width

				$scope.data.gradebookArea = {
					left: left,
					right: right,
					top:top,
					bottom:bottom,
					width:width,
					height:height
				};
				reloadScrollSettings()


			});
			$scope.$watch($scope.getRightColumnWidth,function(width){
				if(width) reloadScrollSettings();
			})
			var timeout
			angular.element('#gradebook-body').scroll(function(){
				var that = this;

				$scope.limits.students.scrollTop = this.scrollTop
				$scope.limits.students.start = parseInt(this.scrollTop/34);
				$scope.limits.students.to = (this.scrollTop+$scope.limits.students.gradebookHeight)/34;
				if(timeout){
					$timeout.cancel(timeout);
				}
				$scope.lastReloadScrollTop = $scope.lastReloadScrollTop|| 0
				if(Math.abs(this.scrollTop-$scope.lastReloadScrollTop)>150){
					timeout = $timeout(function(){
						updateDisplayedCells(that.scrollTop);
					},700);
				}
			});
			angular.element('#gradebook-grades-body').scroll(function(){$scope.data.gradebookLeft = this.scrollLeft});

			function gradebookArea(){
				angular.element('#gradebook-body').height();
			}


			function updateDisplayedCells(scrollTop){
				if($scope.loadingStudents) return;
				$scope.loadingStudents = true;
				var setLoading = !$scope.loadingCell.loading
				if(setLoading)
					$scope.loadingCell.loading=true;



				$timeout(function(){
					angular.forEach($scope.filteredStudents,function(student,i){
						student.show = $scope.showStudent(i);
					})
					$scope.lastReloadScrollTop = scrollTop
					$scope.loadingStudents = false;
					if(setLoading)
						$scope.loadingCell.loading = false;
				})

				//update($scope.limits.pages);
			}
			$scope.showUnit = function(unit){
				return true
			}
			$scope.showPG = function(pagegroup){
				return true

			}

			$scope.reloadVisiblePages = function(scrollLeft){
				if($scope.loadingPages) return;
				$scope.loadingPages = true;
				var setLoading = !$scope.loadingCell.loading
				if(setLoading)
					$scope.loadingCell.loading=true;
				$timeout(function(){
					$scope.lastReloadScroll = scrollLeft
					$scope.loadingPages = false;
					if(setLoading)
						$scope.loadingCell.loading=false;
				})


			}
			$scope.showStudent = function(pos){

				if($scope.limits.students.to==-1){
					return pos>=$scope.limits.students.start-2
				}
				return pos>=$scope.limits.students.start-2 && pos<$scope.limits.students.to+2;
			}
			$scope.$watch('filters.student',function(newValue,oldValue){
				if(newValue != oldValue){
					if($scope.filterTimeout)
						stopFilterTimeout()
					$scope.filterTimeout = setTimeout(function(){
						stopFilterTimeout();
						updateDisplayedCells($scope.lastReloadScrollTop);
					},500)


				}
				function stopFilterTimeout(){
					clearTimeout($scope.filterTimeout);
					delete $scope.filterTimeout;
				}
			})


		}
	]
).directive('focusMe',function(){
		return{
			link:function(scope,element){
				element[0].focus()
				element.bind('blur', function() {
					scope.page.show=false;
				});
			}
		}
	})
	.directive('scrollingTable',['$timeout',function($timeout){
	return {
		restrict : 'A',
		link:function(scope,element,attrs){
			var timeout;
			element.scroll(function(){
				var that = this;
				var siblings = attrs.sibling.split('|')
				angular.forEach(siblings,function(sibling){
					angular.element('#' + sibling).scrollLeft(that.scrollLeft);
				})
				if(timeout){
					$timeout.cancel(timeout);
				}
				scope.limits.pages.start = parseInt(this.scrollLeft/100);
				scope.limits.pages.to = (this.scrollLeft+scope.limits.pages.gradebookWidth)/100;
				scope.limits.pages.scrollLeft = this.scrollLeft;
				scope.lastReloadScroll = scope.lastReloadScroll|| 0
				if(Math.abs(this.scrollLeft-scope.lastReloadScroll)>500){
					timeout = $timeout(function(){
						scope.reloadVisiblePages(that.scrollLeft);
					},700);
				}
			})


		}
	}
}]).factory('loadingCell',function(){
		return {
			loading:false
		}
	})

;
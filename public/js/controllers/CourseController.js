
appControllers.controller('CourseController', ['$rootScope', '$scope', '$timeout', 'Course','Class', 'CurrentCourseId', 'ShowDatesGrades', 'CurrentUnitId', 'Cookiecutter','CurrentSuperUnitId','graderactivity','OrganizationV2',
    function ($rootScope, $scope, $timeout, Course,Class, CurrentCourseId, ShowDatesGrades, CurrentUnitId, Cookiecutter,CurrentSuperUnitId,graderactivity,OrganizationV2) {

        $scope.currentname = '';
        /*
         Golabs 16/01/2015:
         This will select and set the show_dates and show_grades so that we can determine message feeback text
         to the student in the message feedback box.
         */
        var SetDatesGrades = function (CurrentCourses, CurrentCourseId) {
            for (var i = 0; i < CurrentCourses.length; i++) {
                if (parseInt(CurrentCourses[i].id) === parseInt(CurrentCourseId.getCourseId())) {
                    ShowDatesGrades.setDates(parseInt(CurrentCourses[i].show_dates));
                    ShowDatesGrades.setGrades(parseInt(CurrentCourses[i].show_grades));
                    ShowDatesGrades.setShowGradesAsScore(parseInt(CurrentCourses[i].show_grades_as_score));
                    ShowDatesGrades.setShowGradesAsLetter(parseInt(CurrentCourses[i].show_grades_as_letter));
                    ShowDatesGrades.setShowGradesAsPercentage(parseInt(CurrentCourses[i].show_grades_as_percentage));
                }
            }
        }
        var handleGraderCourses = function(courses,addNeedingGrade){
            return _.map(courses,function(course){
                if(addNeedingGrade) {
                    course.originalName = course.name;
                    course.name = course.name + " (" + (course.needingGradeCount || 0) + ")";
                }

                course.classId = course.id;
                course.id = course.courseid;
                return course;
            });
        }
        var courseFetchCallbackFunction = function (courses) {

            if($scope.isGrader){
                courses = handleGraderCourses(courses,true);
            }
            if($scope.isEditor){
                courses = handleGraderCourses(courses);
            }
            if (!$scope.isEditor && !$scope.isGrader) {
                $scope.courses = courses;
                $scope.courses = _.filter(courses.courses, function (course) {
                    //Golabs 25/06/2015
                    //set to show pages with no courses due to teacher wanting to see courses.
                    return course.num_pages >= 0;
                });
            } else {
                $scope.courses = courses.courses || courses;
            }
            if ((angular.isDefined($scope.courses)) && ($scope.courses.length > 0)) {
                CurrentCourseId.setCourseId($rootScope.currentCourseID||Cookiecutter.returncourseid($scope.courses));

                $scope.currentname = Cookiecutter.returncourename(CurrentCourseId.getCourseId(), $scope.courses);

                $rootScope.currentCourseName = $scope.currentname;
                $rootScope.currentCourseID = CurrentCourseId.getCourseId();
                var currentCourse = _.findWhere($scope.courses,{id:CurrentCourseId.getCourseId()})
                $rootScope.currentCourse = currentCourse || $scope.courses[0];
                CurrentCourseId.setCourseInfo(currentCourse)
                $scope.setCurrentCourseLayout($rootScope.currentCourse);

                if(CurrentCourseId.data.use_super_units!=1)
                    $rootScope.$broadcast('NavUpdate');
                else{
                    $scope.$root.useSuperUnits = true;

                }
                SetDatesGrades($scope.courses, CurrentCourseId);
                $rootScope.$broadcast('FINISHED_LOADING_COURSES');
            }
        }

        // If this is the course editor or grader context, we get a different filtered course list that includes only
        // courses that the teacher teaches.
        if(window.location.href.indexOf('/grader/') >= 0){
            $scope.isGrader=true;
        }
        if (window.location.href.indexOf('/editor/') === -1 && window.location.href.indexOf('/grader/') === -1) {
            $scope.isEditor = false;
            Course.get({
                userId: 'me'
            }, courseFetchCallbackFunction);
        } else {
            if (window.location.href.indexOf('/editor/') >= 0) {
                $scope.isEditor = true;
                Class.query({
                    as:'edit_teacher',
                }, courseFetchCallbackFunction);
            } else {
                Class.query({
                    as:'teacher',
                    includePosts:'needingGrade'
                }, courseFetchCallbackFunction);
            }

        }
        $rootScope.$broadcast('STARTED_LOADING_COURSES');

        $scope.$on('pageinfoChange', function(event, arg) {
            if (angular.isDefined($scope.courses)){
                var courseNo = 1;
                for (var i = 0; i < $scope.courses.length; i++) {
                    if ($scope.courses[i].id.split('-')[0] == arg[0]) {
                        courseNo = 0;
                    }
                }
                if (courseNo === 1){
                    toastr.error("You don't have access to this page.");
                    return;
                }

                //$scope.changeCourse(arg[0]);
                //$scope.currentCourseID  = arg[0];
            }
        });

        $scope.changeCourse = function (courseId) {
            if (!courseId || courseId == CurrentCourseId.getCourseId())
                return

            for (var i = 0; i < $scope.courses.length; i++) {
                if ($scope.courses[i].id == courseId) {

                    CurrentSuperUnitId.setId(0)
                    CurrentUnitId.setUnitId(0); //Golabs resetting our unit id.
                    CurrentCourseId.setCourseId($scope.courses[i].id);
                    CurrentCourseId.setCourseInfo($scope.courses[i]);
                    $scope.$root.useSuperUnits = CurrentCourseId.data.use_super_units==1
                    $scope.currentname = $scope.courses[i].name;
                    $rootScope.currentCourseName = $scope.currentname;
                    $rootScope.currentCourseId = courseId;
                    $rootScope.currentCourse = $scope.courses[i];
                    $scope.setCurrentCourseLayout($scope.courses[i]);
                    SetDatesGrades($scope.courses, CurrentCourseId); //calling SetDatesGrades
                    //If nothing in we will clear the left menu and main screen.
                    if (((!angular.isDefined($scope.courses[i].unitCount)) || ($scope.courses[i].unitCount === null)) && !($scope.isEditor || $scope.isGrader)){
                        $rootScope.$broadcast('pageContentEmpty', []);
                        return;
                    }

                    if(CurrentCourseId.data.use_super_units!=1)
                        $rootScope.$broadcast('NavForceReload');
                    else{
                        $scope.$root.useSuperUnits = true;
                        if(window.location.href.indexOf('/grader/') >= 0)
                            $rootScope.$broadcast('NavForceReload');
                    }
                    break;
                }
            }
        }
        $scope.$root.$on('posted',function(event,courseid){
            for (var i = 0; i < $scope.courses.length; i++) {
                if ($scope.courses[i].id == courseid) {
                    var course = $scope.courses[i];
                    if(course.needingGradeCount && course.needingGradeCount>0)
                        course.needingGradeCount--;
                    course.name = course.originalName + " (" + (course.needingGradeCount||0) + ")";
                    $scope.currentname = course.name;
                    $rootScope.currentCourseName = $scope.currentname;
                }
            }
        });

        $scope.setCurrentCourseLayout = function (currentCourse) {
            if (currentCourse.rtl_support == '1') {
                $rootScope.$broadcast('ChangeToRTLCourse');
            } else {
                $rootScope.$broadcast('ChangeToLTRCourse');
            }
            OrganizationV2.get({id:currentCourse.orgId,classId:currentCourse.class_id}).$promise.then(function(org){
                $rootScope.organization = org;
            })

        }
    }
]);
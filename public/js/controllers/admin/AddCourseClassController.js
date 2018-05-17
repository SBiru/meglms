appControllers.controller('AddCourseClassController', ['$rootScope', '$scope','$modal', '$timeout', 'CurrentCourseId', 'EditCourseClass','EditCourse','CurrentDepartmentId','$q','CourseClass', 'ShowDatesGrades',
    function($rootScope, $scope,$modal, $timeout, CurrentCourseId, EditCourseClass,EditCourse,CurrentDepartmentId,$q,CourseClass, ShowDatesGrades) {
        console.log(angular.toJson($rootScope.$state));
        $scope.departmentId = $rootScope.$stateParams.departmentId || CurrentDepartmentId.getDepartmentId();
        $scope.checkingAll = false;

        $scope.gradeScale = ShowDatesGrades.gradeScale;
        $scope.lowestGrade = ShowDatesGrades.getMinimumGradeLetter($scope.gradeScale).min;

        // Get a list of all languages supported by the system
        // for use in language drop-down selector.
        EditCourse.languages({}, function(language) {
            $scope.languages = language.list;
        });
        var handleCourseResponse = function(response){
            if(typeof response.message === 'undefined'){
                var text = '';
                for(var i in response)
                    text += response[i];
                console.log(text);
                return;
            }
            if(response.message == 'successful')
                $scope.courses=response.courses;
            else
                toastr.error(response.message);
        };
        function openCloneQuizzesFlag(then){
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/modalclonequizzesflag.html',
                controller: 'CloneQuizzesFlagController',

            });
            modalInstance.result.then(then);
        }
        var handleTermsResponse = function(response){
            var no_term = {
                name: 'No term',
                id:0
            };
            response.terms.splice(0,0,no_term);
            $scope.terms=response.terms;


        };
        $q.all({
                course_data:EditCourse.getavailablecourses({id: $scope.departmentId}).$promise,
                terms_data:CourseClass.terms({departmentId: $scope.departmentId}).$promise
            }
        ).then(function(response){
                handleCourseResponse(response.course_data);
                handleTermsResponse(response.terms_data);
            });

        $scope.clone = function(course){
            openCloneQuizzesFlag(function(flag){
                var courses;
                if(typeof course === 'undefined')
                    courses= _.where($scope.courses,{cloning:true});
                else
                    courses=[course];
                $scope.cloningStatus = 'Cloning..';
                EditCourse.clone({
                    courses:courses,
                    cloneQuizzes:flag
                },function(response){
                    if(typeof response.message === 'undefined'){
                        var text = '';
                        for(var i in response)
                            text += response[i];
                        console.log(text);
                        return;
                    }
                    if(response.message == 'successful') {
                        toastr.success('Cloned!!');
                        $scope.$broadcast("NavDepartmentUpdate")
                        $.grep(courses,function(c){
                            c.cloning=false;
                        });

                    }
                    else
                        toastr.error(response.message);

                    $scope.cloningStatus = 'Clone Selected';
                });
            })

        };
        $scope.checkAll = function(){
            if($scope.checkingAll){
                for(var i in $scope.courses)
                    $scope.courses[i].cloning=false;
            }
            else{
                for(var i in $scope.courses)
                    $scope.courses[i].cloning=true;
            }
            $scope.checkingAll= !$scope.checkingAll;
        };
        $scope.addCourse = function() {

        };
        $scope.className = '';

        $scope.refreshLowestGrade = function() {
            $scope.lowestGrade = ShowDatesGrades.getMinimumGradeLetter($scope.gradeScale).min;
        }
        $scope['chatPreferenceSelection']=$scope.chatPreferences[1];
        $scope.addClass = function() {
            if($scope.nativeLanguage) {
                var gradeScaleValidation = ShowDatesGrades.validateGradeScale($scope.gradeScale);
                if (gradeScaleValidation.errorFound == false) {
                    EditCourse.submit({
                        department_id: $scope.departmentId,
                        name: $scope.className,
                        description: $scope.courseDescription,
                        exclude_from_alerts: $scope.exclude_from_alerts,
                        native_language: $scope.nativeLanguage.language_id,
                        is_active: $scope.is_active,
                        is_j1_class: $scope.is_j1_class,
                        external_id: $scope.externalId||'',
                        show_dates: $scope.show_dates,
                        show_grades: $scope.show_grades,
                        show_table_of_contents: $scope.show_table_of_contents,
                        show_grades_as_score: $scope.show_grades_as_score,
                        show_grades_as_letter: $scope.show_grades_as_letter,
                        show_grades_as_percentage: $scope.show_grades_as_percentage,
                        chat_mode_code: $scope['chatPreferenceSelection'].code
                    }, function (course) {
                        console.log(angular.toJson(course));
                        if (course.message == 'successful2') {
                            window.location.href = '#/editcourseclass/' + course.class_id;
                            $rootScope.$broadcast('NavDepartmentUpdate');
                        } else {
                            toastr.error(course.message);
                        }
                    });
                } else {
                    toastr.error('Cannot Add Course - Custom Grade Scale Error - ' + gradeScaleValidation.errorMessage);
                }
            } else {
                toastr.error('Error cannot add course because you have not selected a native language.')
            }


        };

        $scope.$on('gradeScaleGradeModal', function(event, data) {
            $(".modal").draggable({
                handle: ".modal-header"
            });
        });

        $scope.setGradingScale = function(){

        };

        /**
         * setGradeLetterUse is called when a user clicks on the label for a grade scale letter. It will set the value
         * of that letter flag to the state of the label checkbox
         *
         * @param useGrade true if the checkbox is in the use grade letter state.
         * @param name the model name for the grade letter
         */
        $scope.setGradeLetterUse = function(useGrade, name){
            $scope.gradeScale[name] = !$scope.gradeScale[name]

            ShowDatesGrades.compensateForGradeLetterUseChange($scope.gradeScale, name)

            $scope.lowestGrade = ShowDatesGrades.getMinimumGradeLetter($scope.gradeScale).min;

            $scope.gradeScale[name] = !$scope.gradeScale[name]
        };
    }
]);
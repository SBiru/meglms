appControllers.controller('EditCourseClassController', ['$rootScope', '$scope', '$timeout', '$controller', '$modal','CurrentCourseId', 'EditCourseClass','CurrentClassId','EditCourse','CourseClass','CurrentDepartmentId', 'ShowDatesGrades','ClassMeta',
    function($rootScope, $scope, $timeout,$controller, $modal, CurrentCourseId, EditCourseClass,CurrentClassId,EditCourse,CourseClass,CurrentDepartmentId, ShowDatesGrades,ClassMeta) {
        $scope.classId = $scope.classId || $rootScope.$stateParams.classId

        $scope.gradeScale = ShowDatesGrades.gradeScale;
        $scope.show_grades_as = {};
        $scope.lowestGrade = ShowDatesGrades.getMinimumGradeLetter($scope.gradeScale).min;
        $scope.a={};
        $scope.a_minus={};
        $scope.a_plus={};
        $scope.b={};
        $scope.b_minus={};
        $scope.b_plus={};
        $scope.c={};
        $scope.c_minus={};
        $scope.c_plus={};
        $scope.d={};
        $scope.d_minus={};
        $scope.d_plus={};

        CurrentClassId.setClassId($scope.classId);
        CourseClass.terms(
            {
                departmentId: CurrentDepartmentId.getDepartmentId()
            }, function (response) {
                $scope.terms = response.terms
            }
        );
        $scope.format = 'dd-MMMM-yyyy';
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        $scope.minDate = new Date();
        $scope.openDatePicker = function($event){
            $event.preventDefault();
            $event.stopPropagation();
            $scope.datepickerOpened = true;
        };


        $scope.stringToBoolean = function (string){
            if (typeof string !== "boolean"){
                switch(string.toLowerCase()){
                    case "true": case "yes": case "1": return true;
                    case "false": case "no": case "0": case null: return false;
                    default: return Boolean(string);
                }
            }
            return string;
        }

        EditCourseClass.query({
            classId: $scope.classId
        }, function (data) {
            $scope.departments = data.departments;
            $scope.classInfo = data;
            $scope.classInfo.externalId = data.external_id;
            $scope.classInfo.lmsId = data.LMS_id;
            $scope.classInfo.expirationDate = data.expiration_date?new Date(data.expiration_date):'';
            $scope.is_active=$scope.stringToBoolean(data.is_active);
            $scope.hide_exempted_activities=data.hide_exempted_activities;
            $scope.exclude_from_alerts=data.exclude_from_alerts;
            $scope.use_super_units=data.use_super_units;
            $scope.no_menu=data.meta.no_menu=='1' || data.meta.no_menu === true;

            $scope.is_j1_class=data.is_j1_class=='1';
            $scope.show_dates = data.show_dates == '1';
            $scope.show_grades =  data.show_grades == '1';
            $scope.show_grades_as.score = data.show_grades_as_score == '1';
            $scope.show_grades_as.letter = data.show_grades_as_letter == '1';
            $scope.show_grades_as.percentage = data.show_grades_as_percentage == '1';
            $scope.classInfo.chatPreferenceSelection = $scope.chatPreferences[data.chat_mode_code];
            $scope.classInfo.nativeLanguage = data.native_language || 'en';
            $scope.term = _.findWhere($scope.terms, {id: data.term_id});
            if(!isNaN(data.a_plus_max)) {
                $scope.a_plus.max = parseInt(data.a_plus_max);
                $scope.a_plus.min = parseInt(data.a_plus_min);
                $scope.a.max = parseInt(data.a_max);
                $scope.a.min = parseInt(data.a_min);
                $scope.a_minus.max = parseInt(data.a_minus_max);
                $scope.a_minus.min = parseInt(data.a_minus_min);
                $scope.b_plus.max = parseInt(data.b_plus_max);
                $scope.b_plus.min = parseInt(data.b_plus_min);
                $scope.b.max = parseInt(data.b_max);
                $scope.b.min = parseInt(data.b_min);
                $scope.b_minus.max = parseInt(data.b_minus_max);
                $scope.b_minus.min = parseInt(data.b_minus_min);
                $scope.c_plus.max = parseInt(data.c_plus_max);
                $scope.c_plus.min = parseInt(data.c_plus_min);
                $scope.c.max = parseInt(data.c_max);
                $scope.c.min = parseInt(data.c_min);
                $scope.c_minus.max = parseInt(data.c_minus_max);
                $scope.c_minus.min = parseInt(data.c_minus_min);
                $scope.d_plus.max = parseInt(data.d_plus_max);
                $scope.d_plus.min = parseInt(data.d_plus_min);
                $scope.d.max = parseInt(data.d_max);
                $scope.d.min = parseInt(data.d_min);
                $scope.d_minus.max = parseInt(data.d_minus_max);
                $scope.d_minus.min = parseInt(data.d_minus_min);
                $scope.use_grade_a_plus = data.use_grade_a_plus == '1';
                $scope.use_grade_a = data.use_grade_a == '1';
                $scope.use_grade_a_minus = data.use_grade_a_minus == '1';
                $scope.use_grade_b_plus = data.use_grade_b_plus == '1';
                $scope.use_grade_b = data.use_grade_b == '1';
                $scope.use_grade_b_minus = data.use_grade_b_minus == '1';
                $scope.use_grade_c_plus = data.use_grade_c_plus == '1';
                $scope.use_grade_c = data.use_grade_c == '1';
                $scope.use_grade_c_minus = data.use_grade_c_minus == '1';
                $scope.use_grade_d_plus = data.use_grade_d_plus == '1';
                $scope.use_grade_d = data.use_grade_d == '1';
                $scope.use_grade_d_minus = data.use_grade_d_minus == '1';
            }
        });

        $scope.className = '';

        $scope.refreshLowestGrade = function() {
            $scope.lowestGrade = ShowDatesGrades.getMinimumGradeLetter($scope.gradeScale).min;
        };

        $scope.canImportStudentData = function(){
            return ($scope.classInfo.externalId)? true : false;
        };

        $scope.importStudentData = function(){
            if($scope.canImportStudentData()) {
                $modal.open({
                    templateUrl: '/public/views/partials/admin/import-student-data.html',
                    controller: 'ImportStudentDataController',
                    size: 'md',
                    backdrop : 'static',
                    resolve: {
                        classId: function () {
                            return $scope.classId;
                        }
                    }
                });
            }
        };

        $scope.fixbadmodel = function(type,info){
            if (type === false){$scope[info]=true}
            else{
                $scope[info] = false;
            }
        }
        function checkDefaultCreditedPoints(){
            var int = parseInt($scope.classInfo.default_exempt_points);
            return !(!int || _.isNaN(int))
        }
        $scope.updateClass = function () {
            if(!checkDefaultCreditedPoints()){
                return toastr.error('Please, enter a valid number for the points for credited activities')
            }
            if($scope.classInfo.nativeLanguage) {

                var gradeScaleValidation = ShowDatesGrades.validateGradeScale($scope.gradeScale);
                if (gradeScaleValidation.errorFound == false) {
                    EditCourseClass.update(ShowDatesGrades.addGradeScaleVariablesToObject({
                        id: $scope.classId,
                        name: $scope.classInfo.className,
                        external_id:$scope.classInfo.externalId,
                        LMS_id:$scope.classInfo.lmsId,
                        expiration_date:$scope.classInfo.expirationDate,
                        default_exempt_points:$scope.classInfo.default_exempt_points,
                        is_active: $scope.is_active,
                        is_j1_class: $scope.is_j1_class,
                        hide_exempted_activities: $scope.hide_exempted_activities,
                        exclude_from_alerts: $scope.exclude_from_alerts,
                        use_super_units: $scope.use_super_units,
                        show_dates: $scope.show_dates,
                        show_grades: $scope.show_grades,
                        show_grades_as_score: $scope.show_grades_as.score,
                        show_grades_as_letter: $scope.show_grades_as.letter,
                        show_grades_as_percentage: $scope.show_grades_as.percentage,
                        show_unit_tabs: $scope.classInfo.changedUnitTabs?$scope.classInfo.show_unit_tabs:undefined,
                        show_table_of_contents: $scope.classInfo.show_table_of_contents,
                        chat_mode_code: $scope.classInfo.chatPreferenceSelection.code,
                        term_id: ($scope.term) ? $scope.term.id : null,
                        meta:$scope.classInfo.meta
                    }, $scope), function (courseclass) {
                        // console.log(angular.toJson(courseclass));

                        if (courseclass.message == 'successful') {
                            EditCourse.update({
                                id: $scope.classInfo.courseId,
                                name: $scope.classInfo.className,
                                external_id:$scope.classInfo.external_id,
                                description:$scope.classInfo.courseDescription,
                                departmentId:$scope.classInfo.departmentId,
                                native_language:$scope.classInfo.nativeLanguage
                            },function(data){
                                if (data.message == 'successful') {
                                    toastr.success('Updated');
                                    $rootScope.$broadcast('NavDepartmentUpdate');
                                    if(!$scope.isAdminView)
                                        window.location.reload();

                                    $scope.cancel();
                                }else{
                                    toastr.error(data.message);
                                }
                            });
                        } else {
                            toastr.error(courseclass.message);
                        }
                    });
                } else {
                    toastr.error('Cannot Add Course - Custom Grade Scale Error - ' + gradeScaleValidation.errorMessage);
                }
            } else {
                toastr.error('Error cannot add course because you have not selected a native language.')
            }
        };

        $scope.setGradingScale = function(){
            $scope.isGradeScaleBusy = true;
        }
        $scope.doneGradingScale = function(){
            $scope.isGradeScaleBusy = false;
        }

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
        $scope.delete = function (){
            if(!confirm("Are you sure you want to delete this class?"))
                return;
            EditCourseClass.delete({id:$scope.classId},function(res){
                if(res.status='success'){
                    window.location.href = '/superadmin/';
                }
                else{
                    toastr.error('An error has occurred');
                }
            })
        };
        $scope.$watch('no_menu',function(newValue){
            if(angular.isDefined(newValue) && newValue != null){
                ClassMeta.save({
                    classId:$scope.classInfo.courseId,
                    no_menu:newValue
                });
            }
        });

    }
]);
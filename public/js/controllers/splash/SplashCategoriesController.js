appControllers.controller('SplashCategoriesController',['$scope','$q','Categories','UserV2','CurrentCourseId','CurrentUnitId','ShowDatesGrades','Menu','$modal','Course',
    function($scope,$q,Categories,UserV2,CurrentCourseId,CurrentUnitId,ShowDatesGrades,Menu,$modal,Course){

        $scope.$root.$watch('user',userChanged);
        $scope.classes=null;
        $scope.goToCourse = goToCourse;
        $scope.gradeText = gradeText;
        $scope.gradeOverall=gradeOverall;
        $scope.getHref = getHref;
        $scope.showTeacherWarning = showTeacherWarning;
        $scope.showStartLearningText = showStartLearningText;
        $scope.openActivitiesModal = openActivitiesModal;

        Course.get({
            userId: 'me'
        }, function (courses) {
            $scope.courses = courses.courses;
        });

        function userChanged(user){
            if(!user) return;
            if(!$scope.classes && !$scope.loading){
                $scope.loading = true;
                Categories.user.query({
                    userId:'me'
                },function(classes){
                    $scope.loading = false;
                    $scope.classes=classes;
                },function(error){
                    $scope.loading = false;
                    $scope.error = error;
                })
            }

        }
        function goToCourse(class_,unit){
            var courseId = class_.courseid || class_.courseId;
            CurrentCourseId.setCourseId(courseId);
            if(unit)
                CurrentUnitId.setUnitId(unit.id);
        }
        function getLetterGrade(percentage){
            return ShowDatesGrades.getGradeLetterString(percentage, ShowDatesGrades.gradeScale);
        }
        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }
        function getHref(page){
            return page.is_exempt!='1'?'/#/'+page.layout+'/'+page.id:'';
        }
        function gradeText(class_,page){
            if(!page) return;
            var points = {
                score:page.score,
                max:page.max_score
            };

            if ((page.isGraded) && (points.score==null)){
                points.score=0;
            }

            if(points && points.max && points.max>0 && points.score!=null){
                var grade ="";
                if(class_.show_grades_as_score){
                    grade+=Math.round(points.score) + "/" + Math.round(points.max);
                }
                if(class_.show_grades_as_percentage){
                    grade+="("+getScorePerc(points)+"%)"
                }
                if(class_.show_grades_as_letter){
                    grade+=" " + getLetterGrade(getScorePerc(points));
                }

                return grade==""?Math.round(points.score) + "/" + Math.round(points.max) + "("+getScorePerc(points)+"%)":grade
            }
            return '';
        }
        function gradeOverall(page){
            var points = {
                score:page.score,
                max:page.max_score
            };
            if(page.minimum_score_for_completion){
                return page.minimumNotAchieved?'low':'high';
            }
            if(points && points.max && points.score!=null){
                return getScorePerc(points)>=50?'high':'low'
            }
            return '';
        }
        function showStartLearningText(){
            if(!hasClasses())
                return false;
            for(var i = 0;i<$scope.classes.length;i++){
                if($scope.classes[i].isStudent)
                    return true;
            }
            return false;
        }
        function showTeacherWarning(){
            if(!hasClasses()){
                return false;
            }
            for(var i = 0;i<$scope.classes.length;i++){
                if($scope.classes[i].isTeacher)
                    return true;
            }
            return false;
        }
        function hasClasses(){
            return $scope.classes && $scope.classes.length;
        }

        function openActivitiesModal(Class) {
            Menu.query({
                courseId : Class.courseId,
                doNotCalculate : [Class.courseId]
            },function (data) {
                var modalInstance = $modal.open({
                    templateUrl: '/public/views/partials/activities-modal.html',
                    controller: 'ActivitiesModalController',
                    windowClass:'activities-modal',
                    resolve : {
                        courseName : function() {
                            return Class.name;
                        },
                        courseData : function () {
                            return data;
                        },
                        current_unit_id : function () {
                            return null;
                        },
                        courseInfo : function () {
                            return _.where($scope.courses, {id:Class.courseId.toString()})[0];
                        },
                        isCourseView : function () {
                            return false;
                        }
                    },
                    size: 'lg'
                });

            },function (error) {
                console.log(error);
            });
        }

    }
]);
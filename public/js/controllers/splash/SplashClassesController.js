appControllers.controller('SplashClassesController',['$scope','$location','$q','MenuV2','Course','ShowDatesGrades','CurrentCourseId','CurrentUnitId','UserV2','$modal','Menu',
    function($scope,$location,$q,MenuV2,Course,ShowDatesGrades,CurrentCourseId,CurrentUnitId,UserV2,$modal,Menu){
        $scope.gradeText = gradeText;
        $scope.formatDate = formatDate;
        $scope.showDueDate= showDueDate;
        $scope.showBox= showBox;
        $scope.getHref = getHref;
        $scope.gradeOverall = gradeOverall;
        $scope.orderPages = orderPages;
        $scope.goToCourse=goToCourse;
        $scope.requires_submission = requires_submission;
        $scope.showTeacherWarning = showTeacherWarning;
        $scope.showStartLearningText = showStartLearningText;
        $scope.openActivitiesModal = openActivitiesModal;

        $scope.$watch('user',userChanged);
        $scope.classes=[];

        Course.get({
            userId: 'me'
        }, function (courses) {
            $scope.courses = courses.courses;
        });

        function userChanged(user){
            if(user){
                myClasses();
            }

        }

        function myClasses(){
            UserV2.getUser().then(function(res){
                getMenus(res.classes);
            });
        }
        function handleName(class_){
            if(class_.isFinished || class_.isSuspended || class_.isExpired){
                class_.isAllowed=false;
            }else{
                class_.isAllowed=true;
            }
            if(class_.isFinished){
                class_.name += ' - Finished';
            }else if(class_.isSuspended){
                class_.name += ' - You are suspended';
            }else if(class_.isExpired){
                class_.name += ' - Class expired on ' + class_.expiration_date;
            }
            return class_
        }
        function getMenus(courses){
            if($location.path()=="/password"){
                return;
            }
            var query = {}
            $scope.loading=true;
            if(!courses.length)
                $scope.loading=false;

            /*
            10/07/2015
            we are limiting the number of class on the splash pages to 15
             */
            var classCount = 0;

            _.each(courses,function(course){
                if (course.isTeacher == false){
                    if (course.is_active === false){
                        return
                    }
                    classCount++;
                }


                if(classCount>16)
                    return;
                var groupId;
                var courseId;
                //if it has '-' then this course uses groups (courseId-groupId)
                if(course.groupId){
                    groupId = course.groupId;
                    courseId = course.courseId;
                }
                else courseId = course.courseId;
                if(!course.isTeacher)
                    query[courseId]=MenuV2.get({courseId:courseId,groupId:groupId}).$promise;
                else{
                    $scope.classes.push(course);
                }
            });

            $q.all(query).then(function(menus){
                for(var id in menus){
                    menus[id].courseid=id;
                    $scope.classes.push(handleName(menus[id]));
                }
                $scope.loading=false;
            },function(error){
                $scope.loading=false;
                $scope.error=true;
            });
        }

        function gradeOverall(page){
            if(page.minimum_score_for_completion){
                return page.minimumNotAchieved?'low':'high';
            }
            var points = page.points;
            if(points && points.max && points.score!=null){
                return getScorePerc(points)>=50?'high':'low'
            }
            return '';
        }
        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }
        function getLetterGrade(percentage){
            return ShowDatesGrades.getGradeLetterString(percentage, ShowDatesGrades.gradeScale);
        }
        function gradeText(class_,page){
            var points = page.points;
        
             if ((page.isGraded) && (points.score==null)){
                points.score=0;
              }

            if(points && points.max && points.max>0 && points.score!=null){
                var grade ="";
                if(class_.show_grades_as_score==1){
                    grade+=Math.round(points.score) + "/" + Math.round(points.max);
                }
                if(class_.show_grades_as_percentage==1){
                    grade+="("+getScorePerc(points)+"%)"
                }
                if(class_.show_grades_as_letter==1){
                    grade+=" " + getLetterGrade(getScorePerc(points));
                }

                return grade==""?Math.round(points.score) + "/" + Math.round(points.max) + "("+getScorePerc(points)+"%)":grade
            }
            return '';
        }
        function orderPages(page){
            return parseInt(page.position);
        }
        function formatDate(page) {
            if(!page.due_date) { return; }
            var dueDate = page.due_date;
            dueDate = dueDate.replace(/-/g,"/");
            return moment(dueDate).format('MMM-DD YY');
        };
        function  showDueDate(class_,page){
            if(!(page.is_gradeable==1 || page.layout.indexOf('quiz')>=0))
                return false
            return class_.showDates==1 && !page.no_due_date &&
                    (
                        (requires_submission(page) && !page.isSubmitted && !page.isGraded) ||
                        (!requires_submission(page)&&!page.isViewed)
                    );

        }
        function showBox(class_,page){
            if(page.disableVisualIndicators) return false;
            if(requires_submission(page) && showDueDate(class_,page) && page.due_date){
                return false;
            }
            return true;
        }

        function requires_submission(page){

            return page.allow_video_post == '1' ||
                page.allow_text_post == '1' ||
                page.allow_upload_post == '1' ||
                page.allow_upload_only_post == '1' ||
                page.is_gradeable_post == '1'  ||
                page.layout.indexOf('quiz')>=0

        }
        function getHref(page){
            var href = page.isAllowed&&page.isExempt!='1'?'/#/'+page.layout+'/'+page.id:'';
            return href;
        }
        function goToCourse(class_,unit){
            var courseId = (class_.courseid || class_.courseId) + '';
            if(class_.groupId && courseId.indexOf('-')<0){
                courseId+='-'+class_.groupId;
            }
            CurrentCourseId.setCourseId(courseId);
            if(unit)
                CurrentUnitId.setUnitId(unit.id);
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
                            return Class.className || Class.name;
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
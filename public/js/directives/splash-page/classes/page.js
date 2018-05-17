angular.module('app').directive('splashPageClassPage',[
    '$location',
    '$q',
    'MenuV2',
    'Course',
    'ShowDatesGrades',
    'CurrentCourseId',
    'CurrentUnitId',
    'UserV2',
    function($location,$q,MenuV2,Course,ShowDatesGrades,CurrentCourseId,CurrentUnitId,UserV2){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/splash-page/classes/page.html',
            link:function($scope){
                $scope.gradeText = gradeText;
                $scope.formatDate = formatDate;
                $scope.showDueDate= showDueDate;
                $scope.showBox= showBox;

                $scope.gradeOverall = gradeOverall;
                $scope.requires_submission = requires_submission;

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
                function formatDate(page) {
                    if(!page.due_date) { return; }
                    var dueDate = page.due_date;
                    dueDate = dueDate.replace(/-/g,"/");
                    return (new Date(dueDate).toLocaleString('en-US', {day:'numeric',month: 'short'})).replace(' ','-');
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
                    return !(requires_submission(page) && showDueDate(class_,page) && page.due_date)
                }

                function requires_submission(page){

                    return page.allow_video_post == '1' ||
                        page.allow_text_post == '1' ||
                        page.is_gradeable_post == '1'  ||
                        page.layout.indexOf('quiz')>=0

                }

            }
        }
    }
])



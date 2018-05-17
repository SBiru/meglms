
appControllers.controller('ProgressBarController', [ '$scope','Nav','History','ShowDatesGrades','CustomProgressBar','Gradebook',
    function($scope,Nav,History,ShowDatesGrades,CustomProgressBar,Gradebook){


        $scope.navService = Nav;
        $scope.getLetterGrade = getLetterGrade;
        $scope.formatGrade = formatGrade;
        $scope.gradeText = gradeText;
        $scope.secondaryGrade = secondaryGrade;
        $scope.showSecondaryGrade = showSecondaryGrade;
         $scope.ProgressBarControllerNo = false;





        $scope.$on('ProgressBarControllerEmpty', function(event, arg) {
             $scope.totalGrade = 0;
             $scope.totalMaxGrade = 0;
             delete $scope.progress_perc;
             $scope.ProgressBarControllerNo = true;
        });
        function showSecondaryGrade(){
            return $scope.class && $scope.class.orgId ==10
        }
        function secondaryGrade(){
            if($scope.progressReport)
            return $scope.progressReport.letterExpectedOrCompletedScore
        }
        function getLetterGrade(percentage){
            return ShowDatesGrades.getGradeLetterString(percentage, ShowDatesGrades.gradeScale);
        }
        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }
        function gradeText(){
            return "Grade on completed work"
        }
        function formatGrade(){
            var points = {
                score:$scope.totalGrade,
                max:$scope.totalMaxGrade
            };
            var class_ = $scope.courseInfo.data;


            if(points && points.max && points.max>0 && points.score!=null) {
                var grade ="";
                $scope.ProgressBarControllerNo = false;
                if (class_.show_grades_as_score == 1) {
                    grade += points.score + "/" + points.max;
                }
                if (class_.show_grades_as_percentage == 1) {
                    grade += "(" + getScorePerc(points) + "%)"
                }
                if (class_.show_grades_as_letter == 1) {
                    grade += " " + getLetterGrade(getScorePerc(points));
                }

                return grade == "" ? points.score + "/" + points.max + "(" + getScorePerc(points) + "%)" : grade
            }
            $scope.ProgressBarControllerNo = true;
            return '';
        }

        var getGrade = function(page){
            var score = page.quiz_score;
            if (score == null || score == 'undefined') {
                score = page.grade;
            }
            if(page.scoreOverride) score = page.scoreOverride;
            var total = page.max_quiz_points || page.total_points;
            return {
                total:total,
                score:score
            };
        };
        function completedSurvey(page){
            return page.layout=='survey' && page.quizFinished
        }
        var progress = function(){
            $scope.navData = $scope.navService.navData;
            if($scope.navData == null) return 0;
            var total = 0;
            var completed = 0;
            var totalMaxGrade = 0;
            var totalGrade=0;
            _.each($scope.navData.units,function(unit){
                _.each(unit.pages,function(page){

                    if(!page.isExempt && (page.is_gradeable=='1' || page.layout.indexOf('quiz')>=0 || completedSurvey(page) )&&page.hide_activity==0){
                        total++;

                        if((page.isGraded)){
                            var grade = getGrade(page);
                            totalGrade+=isNaN(parseFloat(grade.score))?0:parseFloat(grade.score);
                            totalMaxGrade+=parseFloat(grade.total);
                            if(!page.minimumNotAchieved)
                                completed++;
                        }

                    }
                });
            });

            var progress_ = completed/total*100;
            var avg_grade = totalGrade/totalMaxGrade*100;
            return {
                progress:Math.round(isNaN(progress_)?0:progress_),
                avg_grade:Math.round(isNaN(avg_grade)?0:avg_grade),
                totalMaxGrade:parseInt(totalMaxGrade),
                totalGrade:parseInt(totalGrade)
            }
        };

        $scope.$watch('courseInfo.data',function(class_){
            $scope.class= class_;
            var progressBar = CustomProgressBar.init(class_,$scope,'course_view');
            $scope.currentProgressVsExpected = progressBar.currentProgressVsExpected;
            $scope.currentProgressText = progressBar.currentProgressText;
            $scope.shouldUseCustomProgressBar = progressBar.shouldUseCustomProgressBar;
            $scope.barBackground = progressBar.barBackground;
            if(progressBar.shouldUseCustomProgressBar()){
                $scope.formatGrade = progressBar.formatGrade
                $scope.gradeText = progressBar.gradeText
            }

        })
        $scope.$watch('navService.navData',function(){
            getProgress()
        });
        $scope.$root.$on([
            'NavRootUpdate',
            'NavUpdate',
            'NavForceReload',
            'NavRootUpdateMenu',
            'NavUpdateMenu'
        ],function(){
            getProgress()
        });
        function getProgress(){
            var class_ = $scope.courseInfo.data;
            return Gradebook.getProgressReportForUserClass({
                userId:'me',
                classId:class_.class_id
            },function(progressReport){
                $scope.ProgressBarControllerNo = false;
                $scope.progressReport = progressReport;
                $scope.progress_perc = progressReport.percCompletedTasks
                $scope.avg_grade=progressReport.percCompletedScore;
                $scope.totalMaxGrade=progressReport.totalWorkedScore;
                $scope.totalGrade=progressReport.totalScore;
            },function(error){
                $scope.progress_perc = 0
                $scope.avg_grade=null;
                $scope.totalMaxGrade=null;
                $scope.totalGrade=null;
            })
        }
    }
]);
appControllers.controller('SplashProgressBarController', [ '$scope','ShowDatesGrades','CustomProgressBar','Gradebook',
    function($scope,ShowDatesGrades,CustomProgressBar,Gradebook){

        $scope.getLetterGrade = getLetterGrade;
        $scope.formatGrade = formatGrade;
        $scope.gradeText = gradeText;
        $scope.showSecondaryGrade = showSecondaryGrade;
        $scope.secondaryGrade = secondaryGrade;


        function getLetterGrade(percentage){
            return ShowDatesGrades.getGradeLetterString(percentage, ShowDatesGrades.gradeScale);
        }
        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }
        function showSecondaryGrade(){
            return $scope.class && $scope.class.orgId ==10
        }
        function secondaryGrade(){
            if($scope.progressReport)
                return $scope.progressReport.letterExpectedOrCompletedScore
        }
        function gradeText(){
            return "Grade on completed work"
        }
        function formatGrade(){
            var points = {
                score:$scope.totalGrade,
                max:$scope.totalMaxGrade
            };
            var class_ = $scope.class;

            if(points && points.max && points.max>0 && points.score!=null) {
                var grade ="";
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
            return '';
        }
        $scope.$watch('class',function(class_){
            getProgress()
            var progressBar = CustomProgressBar.init(class_,$scope,'splash_page');
            $scope.currentProgressVsExpected = progressBar.currentProgressVsExpected;
            $scope.currentProgressText = progressBar.currentProgressText;
            $scope.shouldUseCustomProgressBar = progressBar.shouldUseCustomProgressBar;
            $scope.barBackground = progressBar.barBackground;
            if(progressBar.shouldUseCustomProgressBar()){
                $scope.formatGrade = progressBar.formatGrade
                $scope.gradeText = progressBar.gradeText
            }

        })
        function getProgress(){
            var class_ = $scope.class;
            if(class_.classid)
            return Gradebook.getProgressReportForUserClass({
                userId:'me',
                classId:class_.classid
            },function(progressReport){
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
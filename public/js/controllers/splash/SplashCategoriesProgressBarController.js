appControllers.controller('SplashCategoriesProgressBarController', [ '$scope','ShowDatesGrades',
    function($scope,ShowDatesGrades){
        $scope.progress=0;
        $scope.avg_grade=0;

        $scope.getLetterGrade = getLetterGrade;
        $scope.formatGrade = formatGrade;

        progress();


        function getLetterGrade(percentage){
            return ShowDatesGrades.getGradeLetterString(percentage, ShowDatesGrades.gradeScale);
        }
        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }
        function formatGrade(){
            var points = {
                score:$scope.totalGrade,
                max:$scope.totalMaxGrade
            };
            var class_ = $scope.class;

            if(points && points.max && points.max>0 && points.score!=null) {
                var grade ="";
                if (class_.show_grades_as_score) {
                    grade += points.score + "/" + points.max;
                }
                if (class_.show_grades_as_percentage) {
                    grade += "(" + getScorePerc(points) + "%)"
                }
                if (class_.show_grades_as_letter) {
                    grade += " " + getLetterGrade(getScorePerc(points));
                }

                return grade == "" ? points.score + "/" + points.max + "(" + getScorePerc(points) + "%)" : grade
            }
            return '';
        }

        var getGrade = function(page){
            var score = page.quiz_score;
            if (score == null || score == 'undefined') {
                score = page.grade;
            }
            if(page.scoreOverride)
                score = parseFloat(page.scoreOverride);
            var total = page.max_quiz_points || page.total_points;
            return {
                total:total,
                score:score
            };
        };

        function progress(){
            var total = 0;
            var completed = 0;
            var totalMaxGrade = 0;
            var totalGrade=0;
            var categories = $scope.class.categories
            _.each(categories,function(cat){
                total++;
                if(cat.completed)
                    completed++;
            });

            var progress_ = completed/total*100;
            var avg_grade = totalGrade/totalMaxGrade*100;
            $scope.progress_perc=$scope.class.perc_completed_tasks;
            $scope.avg_grade=Math.round(isNaN(avg_grade)?0:avg_grade);
            $scope.totalMaxGrade=parseInt(totalMaxGrade);
            $scope.totalGrade=parseInt(totalGrade);
        };

    }
]);
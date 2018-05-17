appControllers.controller('ClassSummaryController', [ '$scope','$filter','ShowDatesGrades',
    function($scope,$filter,ShowDatesGrades){
        $scope.gradeText = gradeText;
        $scope.$watch ('currentPage',getPageName);
        $scope.$watch ('navService.navData',getPages,true);
        $scope.currentPage = $scope.$root.currentPage;


        function getPages(){
            $scope.navData = $scope.navService.navData;
            var pages = [];
            if($scope.navData == null) return pages;

            _.each($scope.navData.units,function(unit) {
                unit_pages = $.grep(unit.pages,function(page){
                    return page.isGraded;
                });
                pages = pages.concat(unit_pages);
            });

            $scope.pages = pages;
        }
        function getPageName(){
            // If the ENG checkbox is checked, make the title be in English, otherwise, translate the title
            if(!$scope.$root.currentPage) return;
            if (document.getElementById('english-language-selector').checked) {
                $scope.$root.pagename = $scope.$root.currentPage.label;
            } else {
                $scope.$root.pagename = $scope.$root.currentPage.subtitle;
            }
        }
        function getGrade(page){
            var score = page.quiz_score;
            if (score == null || score == 'undefined') {
                score = page.grade;
            }
            var total = page.max_quiz_points || page.total_points;
            return {
                total:total,
                score:score
            };
        }
        function gradeText(page){
            var grade = getGrade(page);
            var text = '';
            if($scope.$root.currentCourse.show_grades_as_letter==0 && $scope.$root.currentCourse.show_grades_as_score==0 && $scope.$root.currentCourse.show_grades_as_percentage==0)
                $scope.$root.currentCourse.show_grades_as_score=1;
            if($scope.$root.currentCourse.show_grades_as_score==1){
                text+=grade.score + ' out of ' + grade.total;
            }
            if($scope.$root.currentCourse.show_grades_as_letter==1){
                text+=' ' + ShowDatesGrades.getGradeLetterString(Math.round(100*(grade.score/grade.total)), ShowDatesGrades.gradeScale);
            }
            if($scope.$root.currentCourse.show_grades_as_percentage==1){
                text+=' ' + Math.round(100*(grade.score/grade.total)) + '%';
            }
            return text;
        }



    }
]);
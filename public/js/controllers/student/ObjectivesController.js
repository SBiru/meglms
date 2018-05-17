appControllers.controller('ObjectivesController', ['$rootScope', '$scope','$q','$modal','Nav','EditPage','Standard','ShowDatesGrades',
    function($rootScope,$scope,$q,$modal,Nav,EditPage,Standard,ShowDatesGrades) {
        $scope.contentId = $scope.$stateParams.contentId || $scope.$stateParams.quizId || $scope.$stateParams.vocabId;
        $scope.getPageInfo = getPageInfo;
        $scope.getStandards = getStandards;
        $scope.handlePromises = handlePromises;
        $scope.openRubric = openRubric;
        $scope.formatDate = formatDate;
        $scope.formatGrade = formatGrade;
        $scope.addSIfPlural = addSIfPlural;


        $q.all({
            pageinfo:getPageInfo(),
            standards:getStandards()
        }).then($scope.handlePromises);

        function getPageInfo(){
            return EditPage.get({pageId:$scope.contentId}).$promise;
        }
        function getStandards(){
            return Standard.linked({referred_id:$scope.contentId}).$promise;
        }
        function handlePromises(res){
            $scope.pageinfo = res.pageinfo;
            $rootScope.$broadcast('pageinfoChange', [$scope.pageinfo.courseId]);
            $scope.standardData = res.standards;
        }
        function openRubric(gradeId){
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/student/rubric-modal.html',
                controller: 'RubricStudentController',
                resolve:{
                    data:function(){
                        return {
                            pageid:$scope.pageinfo.id,
                            rubricid:$scope.pageinfo.rubricid,
                            gradeId:gradeId
                        }
                    }
                }

            });
        }
        function formatDate(date){
            return moment(date).format("MMMM Do, YYYY");
        }
        function getScorePerc(points){
            return Math.round((points.score/points.max)*100)
        }
        function getLetterGrade(percentage){
            return ShowDatesGrades.getLetterGrade($scope.courseInfo.data.rubric,percentage);
        }
        function formatGrade(score) {
            if(!(score && $scope.pageinfo)) return;
            var total = $scope.pageinfo.max_points;
            var points = {
                score:score,
                max:total
            };
            var class_ = $scope.courseInfo.data;
            if(points && points.max && points.max>0 && points.score!=null) {
                var grade ="";
                points.score=points.score==""?0:points.score;
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
        function addSIfPlural(word,number){
            return number==1?word:word+'s'
        }

    }
]);
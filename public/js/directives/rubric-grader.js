angular.module('app')


.directive('rubricGrader', [
     '$state','$sce','Rubrics','EditCourse','CurrentCourseId','GradeRubric',
        function($state,$sce,Rubrics,EditCourse,CurrentCourseId,GradeRubric){
            return {
                restrict: 'E',
                scope: {
                    rubricId:'=?',
                    postId:'=?',
                    userId:'=?',
                    score:'=?',
                    nonSubmittable:'=?',
                },
                templateUrl: '/public/views/rubrics/rubric-grader.html',
                link: function ($scope, $element,$attrs) {
                    $scope.selectScore = selectScore;
                    $scope.getScore = getScore;
                    $scope.getMaxRowScore = getMaxRowScore;
                    $scope.totalScore = totalScore;
                    $scope.getGradeRubric = getGradeRubric;
                    $scope.isArchive = isArchive;


                    $scope.$on('gradeRubric', gradeRubric);
                    $scope.rubricData={
                        selectedScore:{}
                    }
                    $scope.isGraderView = $state.includes('gradercontent') || $state.includes('graderarchivecontent');

                    var getRubric = function () {
                        Rubrics.get(
                            {
                                id: $scope.rubricId,
                                org_id: $scope.org_id
                            }, function (response) {
                                for (var i in response)
                                    $scope.rubricData[i] = response[i];
                                var cachedScore = GradeRubric.getCachedScore($scope.postId, $scope.userId);
                                if (($scope.isArchive()||$scope.nonSubmittable) && cachedScore === null ) {
                                    $scope.getGradeRubric();
                                } else {
                                    if (cachedScore !== null) {
                                        $scope.rubricData.selectedScore = cachedScore;
                                        totalScore();
                                    }

                                }
                            }
                        )
                    }
                    var getOrg = function () {
                        var courseId=$scope.$root.classInfo?$scope.$root.classInfo.courseId:CurrentCourseId.getCourseId();

                        EditCourse.get({courseId: courseId}, function (response) {
                                if (typeof response.course !== 'undefined') {
                                    $scope.org_id = response.course.organization_id;
                                    getRubric()
                                }
                            }
                        );
                    }
                    getOrg();

                    function selectScore(row, col, index) {
                        col.index = index;
                        $scope.rubricData.selectedScore[row] = col;
                        $scope.rubricData.selectedScore[row].max_points = parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
                        GradeRubric.setCachedScore($scope.rubricData.selectedScore, $scope.postId, $scope.userId);
                        $scope.totalScore();
                    }

                    function getScore(row) {
                        if (!angular.isDefined($scope.rubricData.selectedScore[row]))
                            return 0;
                        var maxScore = getMaxRowScore(row);
                        var percent = parseFloat($scope.rubricData.selectedScore[row].score) / 100;
                        return maxScore * percent;
                    }

                    function getMaxRowScore(row) {
                        return parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
                    }

                    function totalScore() {
                        var total = 0;
                        if (!angular.isDefined($scope.rubricData))
                            return 0;
                        for (var i = 0; i < $scope.rubricData.grid.rubric_descriptions.length; i++)
                            total += $scope.getScore(i);
                        $scope.score = total;

                    }

                    function getGradeRubric() {
                        if(!$scope.postId)return;
                        GradeRubric.get({
                            postid: $scope.postId,
                            userid: $scope.userId
                        }, function (response) {
                            for (var i in response.grades) {
                                var info = response.grades[i];
                                var selected_col = $scope.rubricData.grid.items[info.row][info.col];
                                $scope.rubricData.selectedScore[info.row] = selected_col;
                                $scope.rubricData.selectedScore[info.row].index = info.col;
                                totalScore();
                            }
                        });
                    };
                    function isArchive() {
                        return $scope.$root.$state.$current.name.indexOf('archive') >= 0;
                    }

                    function gradeRubric(event, data) {
                        data.rubricid = $scope.rubricId;
                        data.userid = $scope.userId;
                        var grid = [];
                        for (var i in $scope.rubricData.selectedScore) {
                            grid.push({
                                row: i,
                                col: $scope.rubricData.selectedScore[i].index
                            })
                        }
                        data.grid = grid;
                        GradeRubric.save(data);
                    }

                    $scope.trustAsHtml=function(html){
                        if(html){
                            return $sce.trustAsHtml(html)
                        }
                    }
                }
            }
        }
])
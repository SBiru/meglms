angular.module('app')


    .directive('rubricStudent', [
        '$q','$sce','Rubrics','GradeRubric',
        function($q,$sce,Rubrics,GradeRubric){
            return {
                restrict: 'E',
                scope: {
                    rubricId:'=?',
                    postId:'=?',
                    userId:'=?',
                    pageId:'=?'
                },
                templateUrl: '/public/views/partials/student/rubric-modal.html',
                link: function ($scope, $element) {
                    $scope.getRubricGrid = getRubricGrid;
                    $scope.getGrade = getGrade;
                    $scope.handlePromises = handlePromises;
                    $scope.fillRubric = fillRubric;
                    $scope.getScore = getScore;
                    $scope.getMaxRowScore = getMaxRowScore;
                    $scope.totalScore = totalScore;
                    $scope.hideHeader=true;



                    $q.all({
                        rubric:$scope.getRubricGrid().$promise,
                        grade:($scope.pageId && $scope.rubricId)?$scope.getGrade().$promise:undefined
                    }).then($scope.handlePromises);

                    function cancel() {
                        $modalInstance.dismiss('cancel');
                    };

                    function getRubricGrid(){
                        return Rubrics.get({
                            id:$scope.rubricId,
                            org_id:0
                        });
                    }
                    function getGrade(){
                        return GradeRubric.get({
                            rubricid:$scope.rubricId,
                            postid:$scope.postId,
                            userid:$scope.userId|'me',
                            pageid:$scope.pageId,
                            orderBy:'postid DESC',
                            groupBy:'postid'
                        });
                    }
                    function handlePromises(res){
                        $scope.rubricData = res.rubric;
                        $scope.gradeData = res.grade;
                        $scope.fillRubric();
                        totalScore();
                    }
                    function fillRubric(){
                        if($scope.gradeData.grades.length==0)
                            return;
                        $scope.rubricData.selectedScore = {};
                        var last_post = _.toArray($scope.gradeData.grades)[0];
                        for(var i in last_post.rows){
                            var info = last_post.rows[i];
                            var selected_col = $scope.rubricData.grid.items[info.row][info.col];
                            $scope.rubricData.selectedScore[info.row]=selected_col;
                            $scope.rubricData.selectedScore[info.row].index = info.col;
                        }
                    }
                    function getScore(row){

                        var maxScore = parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
                        if(!(angular.isDefined($scope.rubricData.selectedScore))){
                            return maxScore
                        }
                        if(!angular.isDefined($scope.rubricData.selectedScore[row]))
                            return 0 ;
                        var percent = parseFloat($scope.rubricData.selectedScore[row].score)/100;
                        return maxScore*percent;
                    }
                    function getMaxRowScore(row){
                        if(!(angular.isDefined($scope.rubricData.selectedScore)))
                            return 0;
                        return parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
                    }
                    function totalScore(){
                        var total = 0;
                        var maxTotal = 0;
                        if(!angular.isDefined($scope.rubricData))
                            return 0;
                        for(var i = 0; i<$scope.rubricData.grid.rubric_descriptions.length;i++){
                            if(angular.isDefined($scope.rubricData.selectedScore))
                                total+=$scope.getScore(i);
                            maxTotal += parseFloat($scope.rubricData.grid.rubric_descriptions[i].score);
                        }

                        $scope.total=total;
                        $scope.maxTotal=maxTotal;
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
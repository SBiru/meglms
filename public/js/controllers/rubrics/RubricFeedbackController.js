
appControllers.controller('RubricFeedbackController', ['$scope','Rubrics',
    function($scope,Rubrics){
        var vm = this;

        vm.rubricid = $scope.post.rubric[0].rubricid;
        vm.rubric = $scope.post.rubric;
        vm.getRubricGrid = getRubricGrid;
        vm.fillRubric = fillRubric;
        $scope.getScore = getScore;
        $scope.getMaxRowScore = getMaxRowScore;

        vm.getRubricGrid();

        function getRubricGrid(){
            Rubrics.get(
                {
                    id:vm.rubricid,
                    org_id:0
                },function(response){
                    $scope.rubricData = response;
                    vm.fillRubric();
                }
            )
        }
        function fillRubric(){
            $scope.rubricData.selectedScore={}
            for(var i in vm.rubric){
                var info = vm.rubric[i];
                var selected_col = $scope.rubricData.grid.items[info.row][info.col];
                selected_col.index=info.col;

                $scope.rubricData.selectedScore[info.row]=selected_col;
            }
        }
        function getScore(row){
            if(!angular.isDefined($scope.rubricData.selectedScore[row]))
                return 0;
            var maxScore = parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
            var percent = parseFloat($scope.rubricData.selectedScore[row].score)/100;
            return maxScore*percent;
        }
        function getMaxRowScore(row){
            if(!(angular.isDefined($scope.rubricData.selectedScore)))
                return 0;
            return parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
        }

    }
]);
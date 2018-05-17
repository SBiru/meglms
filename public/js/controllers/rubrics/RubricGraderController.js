
appControllers.controller('RubricGraderController', [ '$scope','$state','Rubrics','EditCourse','CurrentCourseId','GradeRubric',
    function($scope,$state,Rubrics,EditCourse,CurrentCourseId,GradeRubric){

        var cleanUpWatchers = [];
        $scope.selectScore = selectScore;
        $scope.getScore = getScore;
        $scope.getMaxRowScore = getMaxRowScore;
        $scope.totalScore = totalScore;
        $scope.getGradeRubric = getGradeRubric;
        $scope.isArchive = isArchive;
        cleanUpWatchers.push($scope.$on('gradeRubric',gradeRubric));
        cleanUpWatchers.push($scope.$on('gradeRubricGrid',gradeRubricGrid));
        $scope.isGraderView = $state.includes('gradercontent') || $state.includes('graderarchivecontent');


        var getRubric = function(){
            Rubrics.get(
                {
                    id:$scope.message.rubricid,
                    org_id:$scope.org_id
                },function(response){
                    for(var i in response)
                        $scope.rubricData[i] = response[i];
                    var cachedScore = GradeRubric.getCachedScore($scope.message.id,$scope.message.user_id);
                    if(cachedScore===null){
                        $scope.rubricData.selectedScore={}
                        $scope.getGradeRubric();
                    } else{
                        if(cachedScore!==null){
                            $scope.rubricData.selectedScore = cachedScore;
                            totalScore();
                        }

                    }
                }
            )
        }
        var getOrg = function(){
            EditCourse.get({courseId:CurrentCourseId.getCourseId()},function(response){
                    if (typeof response.course !== 'undefined'){
                    $scope.org_id = response.course.organization_id;
                    getRubric()
                    }
                }
            );
        }
        getOrg();

        function selectScore(row,col,index){
            col.index = index;
            $scope.rubricData.selectedScore[row]=col;
            $scope.rubricData.selectedScore[row].max_points=parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
            GradeRubric.setCachedScore($scope.rubricData.selectedScore,$scope.message.id,$scope.message.user_id);
            $scope.totalScore();
        }
        function getScore(row){
            if(!angular.isDefined($scope.rubricData.selectedScore[row]))
                return 0;
            var maxScore = getMaxRowScore(row);
            var percent = parseFloat($scope.rubricData.selectedScore[row].score)/100;
            return maxScore*percent;
        }
        function getMaxRowScore(row){
            return parseFloat($scope.rubricData.grid.rubric_descriptions[row].score);
        }
        function totalScore(){
            var total = 0;
            if(!angular.isDefined($scope.rubricData))
                return 0;
            for(var i = 0; i<$scope.rubricData.grid.rubric_descriptions.length;i++)
                total+=$scope.getScore(i);
            $scope.message.grade=total;

        }

        function getGradeRubric(){
            if(!$scope.message.update_id)return;
            GradeRubric.get({
                postid:$scope.message.update_id,
                userid:$scope.message.user_id,
                type:$scope.message.rubricType
            },function(response){
                for(var i in response.grades){
                    var info = response.grades[i];
                    var selected_col = $scope.rubricData.grid.items[info.row][info.col];
                    $scope.rubricData.selectedScore[info.row]=selected_col;
                    $scope.rubricData.selectedScore[info.row].index = info.col;
                    totalScore();
                }
            });
        };
        function isArchive(){
            return $scope.$state.$current.name.indexOf('archive')>=0;
        }
        function gradeRubric(event,data){
            data.rubricid = $scope.message.rubricid;
            data.userid = $scope.message.user_id;

            data.grid = gradeRubricGrid();
            GradeRubric.save(data).$promise.then(function(){
                $scope.$root.$broadcast('gradeRubricCompleted',data)
            });
        }
        function gradeRubricGrid (event,data){
            var grid = [];
            for(var i in $scope.rubricData.selectedScore){
                grid.push({
                    row:i,
                    col:$scope.rubricData.selectedScore[i].index
                })
            }
            data && $scope.$root.$broadcast('gradeRubricGridCompleted',_.extend(data,{grid:grid}))
            return grid;
        }


    }
]);
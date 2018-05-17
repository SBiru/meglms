

var appControllers = appControllers || angular.module('app.testbank');
appControllers.controller('RubricsController', [ '$scope','Rubrics','RubricService','CurrentCourseId','Class','Gradebook',
    function($scope,Rubrics,RubricService,CurrentCourseId,Class,Gradebook){

        $scope.service = RubricService;
        $scope.ckeditorOptions={
            toolbar:'basic'
        }
        $scope.data={
            name:""
        };
        $scope.isCourseBuilderView = function(){
            return !$scope.$state || !$scope.$state.includes('rubrics');
        };
        $scope.isCreateState = function(){
            return $scope.$state.current.name == 'rubrics.create';
        }
        $scope.createGrid = function(rows,cols){
            //default table size
            $scope.data.rows = angular.isDefined(rows)?rows:5
            $scope.data.cols = angular.isDefined(cols)?cols:5


            $scope.rubric_grid = [];
            $scope.header = [];
            $scope.rubric_descriptions=[];
            for(var i = 0;i<$scope.data.rows;i++){
                $scope.rubric_grid.push([{
                    text:"",
                    score:0,
                    ck:0
                }]);

                $scope.rubric_descriptions.push({text:"",score:0});
                for(var j = 0;j<$scope.data.cols;j++){
                    if(j!=0)
                        $scope.rubric_grid[i].push({
                            text:"",
                            score:0,
                            ck:0
                        });
                    if(i==0)
                        $scope.header.push({
                            text:""
                        });
                }
            }
        };


        var fillGrid = function(grid,descriptions,header){
            for(var i in header){
                $scope.header[i]=header[i];
            }
            for(var i in grid){
                var row = grid[i];
                $scope.rubric_descriptions[i]=descriptions[i];
                for(var j in row){
                    $scope.rubric_grid[i][j]=grid[i][j];
                    $scope.rubric_grid[i][j].ck=0;
                }
            }
            $scope.original_max_points = getMaxPoints();
        }


        var getMaxPoints = function(){
            var total = 0;
            for(var i in $scope.rubric_descriptions){
                if(isNaN(parseFloat(i)))
                    continue;
                total+= parseFloat($scope.rubric_descriptions[i].score);
            }
            return total;
        }
        $scope.getMaxPoints = getMaxPoints;
        var getRubric = function (){
            if(angular.isDefined($scope.rubric_id)){
                Rubrics.get({
                        org_id: $scope.org_id,
                        id: $scope.rubric_id
                    }, function (response) {
                        $scope.loading=false;
                        if(!angular.isDefined($scope.rubric_id)){
                            $scope.createGrid();
                            $scope.invalid_rubric = false;
                            return
                        }
                        if(response.info==false || !angular.isDefined(response.info)){
                            $scope.invalid_rubric = true;
                            return;
                        }
                        $scope.invalid_rubric = false;
                        $scope.createGrid(response.info.rows,response.info.cols);
                        $scope.data.name= response.info.name;
                        $scope.data.needGradebookRecalculation = response.info.needGradebookRecalculation;
                        fillGrid(response.grid.items,response.grid.rubric_descriptions,response.grid.header);
                    }
                )

            }
            $scope.loading = false;
        };
        if($scope.state=='rubrics.edit'){
            $scope.loading = true;
            $scope.org_id = $scope.$state.params.org_id
            $scope.rubric_id = $scope.$state.params.id;

            getRubric();
        }
        else{
            $scope.createGrid();
        }



        $scope.save = function(create,recalculate){
            $scope.loading = true;
            $scope.saving = 1;
            var data = angular.copy($scope.data);
            data.page_id = $scope.contentid;
            data.id=$scope.rubric_id;
            data.org_id = $scope.org_id || 0;
            data.recalculate = recalculate;
            data.grid = {
                items: $scope.rubric_grid,
                rubric_descriptions: $scope.rubric_descriptions,
                header:$scope.header,
            }
            if(!recalculate && $scope.data.needGradebookRecalculation && $scope.original_max_points != getMaxPoints()){
                Gradebook.openRecalculationWarning(
                    function(){
                        $scope.save(create,'now')
                    },
                    function(){
                        $scope.save(create,'later')
                    }
                )
            }
            else{
                if(!$scope.isCourseBuilderView() && !$scope.isCreateState()){
                    Rubrics.update(data,function(res){
                        $scope.loading = false;
                        $scope.saving = 0;
                        $scope.$root.$emit('update',{id:$scope.rubric_id,name:$scope.data.name});
                    });
                    $scope.original_max_points = getMaxPoints()
                }

                else{
                    if($scope.isCourseBuilderView()){
                        data.classid = CurrentCourseId.getCourseInfo().classId;
                        data.org_id = CurrentCourseId.getCourseInfo().orgId;
                    }
                    else{
                        data.classid = RubricService.class_id;
                    }
                    Rubrics.create(data,function(response){
                            $scope.loading = false;
                            if(response.status=='success') {
                                $scope.saving = 0;
                                if(angular.isDefined(response.id)){
                                    $scope.$root.$emit('create', {id: response.id, name: response.name});
                                    $scope.rubric_id = response.id;
                                    RubricService.data.id = response.id;
                                }
                                else{
                                    $scope.$root.$emit('update',{id:$scope.rubric_id,name:$scope.data.name});
                                }


                            }else{
                                $scope.saving = 2;
                            }
                            $scope.service.data.has_changes=false;
                            $scope.original_max_points = getMaxPoints()
                            if($scope.pageWaiting){
                                $scope.pageWaiting = false;
                                $scope.$emit('rubricSaved');
                            }
                        }, function(error){
                            $scope.saving = 2;
                            console.warn(error);
                        }
                    );
                }
            }


        }
        $scope.hasChanges = function($event){
            $scope.service.data.has_changes = true;
        }

        $scope.resetckshow = function(){
                for (var i = 0; i < $scope.rubric_grid.length;i++)
                {
                  if (angular.isDefined($scope.rubric_grid[i])){
                  for (var j = 0; j < $scope.rubric_grid[i].length;j++)
                  {
                     $scope.rubric_grid[i][j].ck = 0;                  
                  }
                  }      
                }
        }

        $scope.delete = function(){
            if(confirm('Are you sure you want to delete this rubric?') ==true) {
                $scope.loading = true;
                Rubrics.delete({
                    id:$scope.rubric_id
                },function(response){
                    $scope.loading = false;
                    $scope.$root.$emit('delete',{id:$scope.rubric_id});

                    $state.go("rubrics", {
                        org_id: $scope.org_id
                    });
                });
            }
        }
        $scope.show_delete_button = function(){
            return $scope.state=='rubrics.edit';
        }

        $scope.add_row = function(){
            $scope.rubric_descriptions.push({text:"",score:0});
            $scope.rubric_grid.push([]);
            for(var j = 0;j<$scope.data.cols;j++){
                $scope.rubric_grid[$scope.rubric_grid.length-1].push({
                    text:"",
                    score:0
                });
            }
            $scope.data.rows++;
        }

        $scope.add_col = function(){
            $scope.header.push("");

            for(var i = 0;i<$scope.rubric_grid.length;i++){
                $scope.rubric_grid[i].push({
                    text:"",
                    score:0
                });
            }
            $scope.data.cols++;
        }
        $scope.remove_row = function(index){
            $scope.rubric_grid.splice(index,1);
            $scope.rubric_descriptions.splice(index,1);
            $scope.data.rows--;
        }
        $scope.remove_col = function(index){
            $scope.header.splice(index,1);
            for(var i = 0; i<$scope.rubric_grid.length; i++){
                $scope.rubric_grid[i].splice(index,1);
            }
            $scope.data.cols--;
        }
        $scope.copy_row_down = function(index){
            var row = $scope.rubric_grid[index];
            var description = $scope.rubric_descriptions[index];
            $scope.rubric_grid.splice(index,0, _.clone(row));
            $scope.rubric_descriptions.splice(index,0, _.clone(description));
            $scope.data.rows++;
        }
        $scope.reloadClasses = function(){
            Class.query({
                    as:'edit_teacher'
                },function(classes){
                    $scope.classes = classes;

                },function(error){
                    $scope.error = error.error;
                }
            )
        }

        $scope.$watch('rubric_descriptions',function(){
            if(angular.isDefined($scope.grade) && $scope.use_rubric==1){
                $scope.grade.max_points = getMaxPoints();
            }
        },true);
        if($scope.$root!=null)
            $scope.$on('create_new',function(){
                $scope.state='rubrics.create';
                $scope.data.name="";
                $scope.createGrid();
            });
        if($scope.isCourseBuilderView()){
            $scope.$watch('service.data.selected_id',function(newValue){
                $scope.rubric_id = newValue;
                RubricService.data.id = newValue;
                $scope.state='rubrics.edit';
                getRubric();
                if(angular.isDefined($scope.grade) && $scope.use_rubric==1){
                    $scope.grade.max_points = getMaxPoints();
                }
            });
            $scope.$watch('$parent.org_id',function(){
                $scope.org_id = $scope.$parent.org_id;
                if($scope.waitingOrg){
                    $scope.waitingOrg=false;
                    getRubric();
                }
            })
            $scope.$watch('$parent.state',function(){
                $scope.org_id = $scope.$parent.state;
            });
            $scope.$on('saveRubric',function(event,data){
                if(angular.isDefined(data) && data.savePage)
                    $scope.pageWaiting = true;
                $scope.save();
            });
        }
    }
]);
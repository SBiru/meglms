
appControllers.controller('StandardController', [ '$scope','Standard','StandardData','$http',
    function($scope,Standard,StandardData,$http){
        $scope.id = $scope.$root.$stateParams.id || 0;
        $scope.org_id = $scope.$root.$stateParams.org_id;
        $scope.msgError="";
        $scope.standard={
            parentid:"0",
            org_id:$scope.org_id
        };
        $scope.dataService = StandardData;
        $scope.dataService.org_id = $scope.org_id;
        if($scope.id){
            Standard.get({id:$scope.id,org_id:$scope.org_id},function(data){
                $scope.standard = data;
            });
        }
        if(StandardData.data.length==0)
            StandardData.refresh();

        $scope.add = function(){
            if(!$scope.standard.name || $scope.standard.name==''){
                $scope.msgError="Standard name must not be empty";
                return;
            }
            $scope.msgError="";
            Standard.create($scope.standard,function(data){
                if(angular.isDefined(data.id)){

                    StandardData.refresh();
                }
                else{
                    $scope.msgError=data.error;
                }

            });
        }
        $scope.delete = function(){
            if(!confirm('Are you sure you want to delete this standard?'))
                return;
            Standard.delete({id:$scope.id},function(data){
                if(data.status=='success'){

                    StandardData.refresh()
                }


            });
        }
        $scope.edit = function(){
            if(!$scope.standard.name || $scope.standard.name==''){
                $scope.msgError="Standard name must not be empty";
                return;
            }
            $scope.msgError="";
            Standard.update($scope.standard,function(data){
                if(data.status=='success'){

                    StandardData.refresh();
                }
                else{
                    $scope.msgError=data.error;
                }
            });
        }
        $scope.$watch('dataService.data',function(newValue){
            $scope.standardsArray = flatter(newValue);
        });
    }
]);


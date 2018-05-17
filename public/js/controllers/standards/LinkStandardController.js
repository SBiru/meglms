appControllers.controller('LinkStandardController',['$scope','Standard','StandardData','CurrentCourseId',
    function($scope,Standard,StandardData,CurrentCourseId){

        $scope.type = $scope.$parent.standard.type;
        $scope.referred_id = $scope.$parent.standard.referred_id;

        $scope.standardData = StandardData;
        $scope.standardData.refresh(CurrentCourseId.getCourseId());
        $scope.$watch('standardData.data',function(){
            $scope.flatStandards = $scope.standardData.flattened();
        },true);
        if(angular.isDefined($scope.referred_id))
            Standard.linked({
                type:$scope.type,
                referred_id:$scope.referred_id
            },function(response){
                $scope.standardData.links = response.standards;
            });
        $scope.save = function(){
            $scope.loading_saveStandard=true;
            Standard.link(
                {
                    id: _.map($scope.standardData.links,function(s){return s.standard_id}),
                    type: $scope.type,
                    referred_id:$scope.referred_id
                },function(response){
                    $scope.loading_saveStandard=false;
                    if(response.status!='success')
                        toastr.error(response.status)
                }
            )
        }
        $scope.new = function(){
            $scope.standardData.links.push({});
        }
        $scope.remove = function(index){
            $scope.standardData.links.splice(index,1);
        }
        $scope.$on('saveStandard',function(event,data){
            $scope.referred_id=data.id;
            $scope.save();
        })
    }
]);
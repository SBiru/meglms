appControllers.controller('PageTypePermissionController', ['$scope','OrganizationV2',
    function($scope,OrganizationV2) {
        $scope.org_id = $scope.$state.params.organizationId

        $scope.ok = function(){
            var options = {
                page_type_permissions: $scope.organizationPageTypePermissions,
                id:$scope.org_id
            }
            OrganizationV2.updatePagePermissions(options,function(ok){

            },function(error){
                console.warn(error);
            })

        }
    }
]);
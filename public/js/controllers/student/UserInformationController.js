appControllers.controller('UserInformationController', ['$rootScope', '$scope', '$sce','$q', 'Page',
    function($rootScope, $scope, $sce,$q, Page) {

        var pageId = $scope.$state.params.contentId;

        getPage();
        function getPage() {
            Page.userInformation({id: pageId},
                function (response) {
                    $scope.pageData = response
                    $scope.$root.pagename = response.pagename;
                },
                function (error) {
                    $scope.error = error.error;
                }
            )
        }
        $scope.save = function(){
            if(!canSave()){
                toastr.error($scope.msgError);
                return;
            }
            $scope.saving = true;

            Page.saveUserInformation(_.extend({id: pageId},$scope.pageData)).$promise.then(function(){
                $scope.saving = false;
                $scope.$root.$emit('NavRootUpdate');
                toastr.success('Saved!');
            },function(){
                $scope.saving = false
            })
        }
        function canSave(){
            $scope.msgError = '';
            var possible = ['nationality','gender','language','department','department_contact','department_email'];
            var required = [];
            _.each(possible,function(field){
                if($scope.pageData.pageOptions[field])
                    required.push(field);
            })

            for(var i = 0;i<required.length;i++){
                var field = required[i];
                if(!$scope.pageData[field]){
                    $scope.msgError = 'All fields are required';
                    return false;
                }

            }
            if(required.indexOf('department_email') >= 0 && $scope.pageData.department_email !== $scope.pageData.department_email_confirm){
                $scope.msgError = 'Emails must be the same';
                return false;
            }
            return true;
        }

    }
]);
appControllers.controller('EditAdvisorsModal', ['$rootScope','$scope','$modal','orgId','Powerschool','OrganizationV2','Alerts',
    function($rootScope,$scope,$modal,orgId,Powerschool,OrganizationV2,Alerts) {
        $scope.loading = true;
        $scope.customsort = function(word) {
            return word.toLowerCase();
        };
        $scope.loadAdvisors = function () {
            Powerschool.getAdvisors({}, function (advisors) {
                delete advisors.$promise;
                delete advisors.$resolved;
                $scope.advisors = advisors;
                $scope.advisorNames = Object.keys(advisors);
            });
        };
        $scope.loadUsers = function () {
            OrganizationV2.getUsers(
                {'id':10},
                function(users){
                    $scope.users = users;
                    $scope.loading = false;
                },
                function(error){
                    $scope.error = error.error;
                }
            );
        };
        $scope.cancel = function() {
            $scope.$dismiss('cancel');
        };
        $scope.angularIsEmpty = function(array) {
            return (array.length<=0);
        };
        $scope.linkToUser = function(user) {
            if($scope.selectedAdvisor) {
                var is_duplicate = false;
                for(var i=0; i<$scope.advisors[$scope.selectedAdvisor].length; i++) {
                    if($scope.advisors[$scope.selectedAdvisor][i].id == user.id) {
                        toastr.info("This user is already linked to "+$scope.selectedAdvisor);
                        return;
                    }
                }
                Powerschool.linkAdvisorToUser({name: $scope.selectedAdvisor, user: user}, function (response) {
                    if (response.message == "Success") {
                        $scope.advisors[$scope.selectedAdvisor].push({
                            id: user.id,
                            first_name: user.firstName,
                            last_name: user.lastName,
                            email: user.email
                        });
                        toastr.success($scope.selectedAdvisor + " linked to " + user.firstName + " " + user.lastName);
                    }
                    else {
                        toastr.error("Failed to save");
                    }
                });
            }
            else {
                toastr.error("No Advisor Selected");
            }
        };
        $scope.unlinkAdvisorAndUser = function(user) {
            Alerts.warning({
                title:'Remove From List',
                content:'Are you sure you want to unlink ' + user.last_name + ', ' + user.first_name + ' and powerschool advisor \'' + $scope.selectedAdvisor + '\'?',
                textOk:'Ok'
            },function() {
                Powerschool.unlinkAdvisorAndUser({name: $scope.selectedAdvisor, id: user.id}, function(response) {
                    if (response.message == "Success") {
                        var indexToDelete = $scope.advisors[$scope.selectedAdvisor].indexOf(user);
                        $scope.advisors[$scope.selectedAdvisor].splice(indexToDelete,1);
                    }
                });
            });
        };
        $scope.selectAdvisor = function(advisor) {
            $scope.selectedAdvisor = advisor;
        };
        $scope.loadAdvisors();
        $scope.loadUsers();
    }
    ]);
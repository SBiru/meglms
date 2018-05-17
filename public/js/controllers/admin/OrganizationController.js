appControllers.controller('OrganizationController', ['$rootScope', '$scope', '$timeout', 'Organization', 'CurrentOrganizationId', 'Cookiecutter',
    function($rootScope, $scope, $timeout, Organization, CurrentOrganizationId, Cookiecutter) {
        $rootScope.$broadcast('ClassManagementMenu');
        $scope.currentname = '';
        Organization.get({
            userId: 'me'
        }, function(organizations) {

            $scope.organizations = organizations.organizations;

            if ($scope.organizations.length > 0) {
                CurrentOrganizationId.setOrganizationId(Cookiecutter.returnorganizationid($scope.organizations));
                $scope.currentid = CurrentOrganizationId.getOrganizationId();
                $scope.currentorganization = _.findWhere($scope.organizations, {id: $scope.currentid});
                $scope.currentname = $scope.currentorganization.name;
                $rootScope.$broadcast('NavOrganizationUpdate');
                window.location.href = "#/editorganization/"+$scope.currentid;
            }
        });
        $scope.$on('NavAddedOrganizationUpdate', function(event, data) {
            Organization.get({
                userId: 'me'
            }, function(organizations) {

                $scope.organizations = organizations.organizations;

                if ($scope.organizations.length > 0) {
                    CurrentOrganizationId.setOrganizationId($scope.organizations[0].id);
                    $scope.currentname = $scope.organizations[0].name;
                    $scope.currentorganization = $scope.organizations[0];
                    $rootScope.$broadcast('NavOrganizationUpdate');
                }
            });
        });
        $scope.changeOrganization = function(organizationId) {

            for (var i = 0; i < $scope.organizations.length; i++) {
                if ($scope.organizations[i].id == organizationId) {
                    CurrentOrganizationId.setOrganizationId($scope.organizations[i].id);
                    $scope.currentid = CurrentOrganizationId.getOrganizationId();
                    $scope.currentname = $scope.organizations[i].name;
                    $scope.currentorganization = $scope.organizations[i];

                    $rootScope.$broadcast('NavOrganizationUpdate');
                }
            }
        }
    }
]);
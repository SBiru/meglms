/**
 * This controller is in charge of keeping track of context for the admin page.
 */
appControllers.controller('ManageClassesController', ['$rootScope', '$scope',
    function($rootScope, $scope) {
        $rootScope.$broadcast('ClassManagementMenu');
    }

]);
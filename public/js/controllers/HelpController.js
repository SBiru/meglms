appControllers.controller('HelpController', ['$rootScope', '$scope','$modal',
    function($rootScope,$scope,$modal) {

        $scope.open = function() {

            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/help-modal.html',
                controller: 'HelpModalController',
                size: 'sm',
                windowClass: 'help-modal-window',
            });

        };

    }
]);
appControllers.controller('HelpModalController', ['$rootScope', '$scope','$modalInstance',
    function($rootScope,$scope,$modalInstance) {
        $scope.support_email = $scope.$root.user.org.support_email || 'support@english3.com';
        $scope.close = function (){
            $modalInstance.dismiss('cancel');
        }
    }
]);
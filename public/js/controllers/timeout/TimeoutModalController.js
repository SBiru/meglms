appControllers.controller('TimeoutModalController', ['$scope','Session','$modalInstance','$http','timeleft',
    function($scope,Session,$modalInstance,$http,timeleft) {
        $scope.iamhere = function (){
            Session.restartTimeout();
            $modalInstance.close();
        };

        $scope.$watch('timeleft',function(){
            $scope.$broadcast('timer-set-countdown',$scope.$root.timeleft);
        })
        $scope.logout=function(){
            window.location='/signout/';
        }

    }
])

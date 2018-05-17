appControllers.controller('TimeoutController', [ '$scope','$modal','$q','$interval','$timeout','Session',
    function($scope,$modal,$q,$interval,$timeout,Session){
        $scope.$root.checkTimeout = checkTimeout;
        function checkTimeout(){
            Session.timeleft().then(function(res){
                if(!res.timeleft || res.timeleft<=0){
                    window.location='/';
                }

                $scope.$root.timeleft = res.timeleft;

                if(!$scope.modal && res.timeleft<=120){
                    openModal();
                }

            });
        }
        checkTimeout();
        function openModal(size){
            var modalInstance = $modal.open({
                templateUrl: '/public/views/timeout/modal.html',
                controller: 'TimeoutModalController',
                size: size,
                resolve: {
                    timeleft : function() { return $scope.timeleft; }
                }
            });
            modalInstance.result.then(function(res){
                $scope.modal=undefined;
            })
            $scope.modal = modalInstance;
        }
        $interval(checkTimeout,60000);
    }
]);
appControllers.controller('ClassAnnouncementsModalController',['$scope','$modalInstance','$sce','Announcements',
    function($scope,$modalInstance,$sce,Announcements){
        $scope.cancel = function(){
            $modalInstance.dismiss('cancel');
        }
        $scope.canClose = function(){
            var flag = true;
            for(var i = 0;i<$scope.$root.announcements.length;i++){
                if(!$scope.$root.announcements[i].isViewed){
                    flag=false;
                    break;
                }
            }
            return flag;
        }

    }
])


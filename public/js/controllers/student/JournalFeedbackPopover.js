appControllers.controller('JournalFeedbackPopover',
    ['$scope','$sce',
        function($scope,$sce){
            $scope.post = $scope.info.post;
            $scope.page = $scope.info.page;
            $scope.trustAsHtml=function(html){
                if(html){
                    return $sce.trustAsHtml(html);
                }
            }
        }
]);
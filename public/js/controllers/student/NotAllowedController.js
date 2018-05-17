appControllers.controller('NotAllowedController', [ '$scope','$location','Nav',
    function($scope,$location,Nav){
        $scope.reason = $location.search()['reason'];
    }
]);
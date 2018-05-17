appControllers.controller('DateFilter',['$scope',function($scope){
    $scope.openStartDate = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.openedStartDate = true;
        $scope.openedEndDate = false;
    };

    // openEndDate is called when a user clicks on the calendar button under the end date range filter field
    $scope.openEndDate = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedStartDate = false;
        $scope.openedEndDate = true;
    };

    // dateOptions for the start and end date range filter fields.
    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };
}])
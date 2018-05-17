export default function AppMenuController($rootScope, $scope, $state, $stateParams, nav, TimedReviewService) {
  // give this controller 'a little more scope'
  $scope.nav = nav;
  $scope.course = nav.selected_course;
  $scope.data = [];
  // no bank id was provided (clicked on tab) so choose one for the visitor
  TimedReviewService.list().success(response => {
    $scope.data = {timedReviews: response}
    nav.data = {timedReviews: response}
  })
  .error(function(error) {
    console.log(error)
  });
  /*
  TestbankBankService.getByOrg(0)
  .success(function(response) {
    $scope.data = response;
    nav.data = response;
    if ($state.current.name == "banks") {
      if (angular.isDefined($scope.data.banks)) {
        TestbankBankService.setBanks($scope.data.banks);
        $state.go("banks.detail", {
          bankId: $scope.data.banks[0].id
        });
      }

    }
  })
  */
}



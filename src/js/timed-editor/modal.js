
export default function ModalController($modalInstance, $scope, TimedReviewService) {
  $scope.data = {
    title: '',
    description: '',
  }
  $scope.create = _ => {
    TimedReviewService.create($scope.data).success(response => {
      if (response.error) {
        return $scope.error = response.error;
      }
      
      $modalInstance.close(response);
    })
  }
  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };
}

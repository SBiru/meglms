(function () {
var app;
try {
    app = angular.module('app.testbank');
}
catch (err) {
    app = angular.module('app');
}
app.controller('ModalCreateQuizController', ['$scope', '$modalInstance', 'TestbankTestService',
    function($scope, $modalInstance, TestbankTestService) {
        $scope.data = {}
        $scope.course = {id:$scope.$root.currentCourseID};
        $scope.ok = function() {
            TestbankTestService.createFor($scope.course.id, $scope.data)
                .success(function(response) {
                    if (angular.isDefined(response.error)) {
                        $scope.error = response.error;
                    } else {
                        $modalInstance.close(response);
                    }
                })
                .error(function(error) {
                    console.log(error);
                });

        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }
])

}());
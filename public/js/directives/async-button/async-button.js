'use strict';

try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
app

    /*
    Usage; Button for async actions. When the user send an action, you should set a loading variable to 1.
        After the response, the loading variable should be 0 for sucess or 2 for error

    Parameters
    text: Text to be display when no action was required
    flash-text: Text that will be flashed for 1 second after a successful response
    loading: integer acceptable values:
        - 1 (start loading)
        - 0 (successful response - will display the flash message)
        - 2 (error response - will not display the flash message)
    colorStyle: it uses the bootstrap color scheme. Acceptable values are: "primary", "danger", "warning", etc..
      */
.directive('asyncButton',['$timeout',function($timeout){
    return {
        restrict: 'E',
        scope:{
            text:'@text',
            flashText:'@flashText',
            colorStyle:'@colorStyle',
            className:'=',
            loading:'=',
            disabled:'=',
        },
        templateUrl:'/public/views/directives/asyncButton.html',

        link: function($scope,$element){
            if(!$scope.colorStyle){
                $scope.colorStyle='primary';
            }
            if(!$scope.className){
                $scope.className = 'btn-sm';
            }

            $scope.currentText=$scope.text;

            $scope.$watch('loading',function(newValue){
                if(newValue===1){
                    $scope.waitingForResponse = true;
                }
                if(newValue===0 && $scope.waitingForResponse){
                    $scope.waitingForResponse=false;
                    $scope.currentText=$scope.flashText;
                    $timeout(function(){
                        $scope.currentText=$scope.text;
                    },1000);
                }
            });
        }
    }
}]);

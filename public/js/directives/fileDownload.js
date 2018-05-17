angular.module('app')
    .directive('fileDownload', [function () {
        return {
            restrict: 'A',
            replace: true,
            template:'<div class="btn btn-info btn-sm" data-ng-click="download()">Download <span class="fa fa-download"></span></div>',
            scope: {
                options:'=?',
                download:'=?'
            },
            controller: ['$scope', '$element', '$attrs', '$timeout', function ($scope, $element, $attrs, $timeout) {
                $scope.progress = 0;

                function prepare(url) {
                    console.log("Please wait", "Your download starts in a few seconds.", $scope.progress);
                }
                function success(url) {
                    console.log('download complete');
                }
                function error(response, url) {
                    console.error("Couldn't process your download!");
                }



                $scope.download = function () {
                    $scope.progress = 0;
                    var options ={
                        prepareCallback: prepare,
                        successCallback: success,
                        failCallback: error
                    };
                    $.extend(options,$scope.options);

                    $.fileDownload($attrs.href, options);
                }
            }]
        }
    }]);
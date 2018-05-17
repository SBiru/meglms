angular.module('app')
    .directive('customInclude', function() {
        return {
            restrict: 'AE',
            templateUrl: function(ele, attrs) {
                return attrs.templatePath;
            }
        };
    });
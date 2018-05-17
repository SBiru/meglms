'use strict';
(function(angular){
angular.module('app').directive('noMenuFooter',['noMenuFooterOptions',function(noMenuFooterOptions){
    return{
        restrict:'EA',
        templateUrl:'/public/views/directives/no-menu-footer.html',
        link:function(scope){
            scope.options = noMenuFooterOptions;
            scope.defaultNextText = 'Next <span class="fa fa-chevron-right"></span>';
            scope.defaultNextClassName = 'btn-success';
            scope.buttonClass = noMenuFooterOptions.nextClassName||scope.defaultNextClassName
            var unWatch = scope.$watch('options',function(){
                scope.buttonClass = noMenuFooterOptions.nextClassName||scope.defaultNextClassName;
            },true)
            scope.$on("destroy",function(){
                unWatch();
            })
        }
    }
}]).factory('noMenuFooterOptions',function(){
    return{
        restartValues:function(){
            this.nextText = null,
            this.isIdVerification = false
        }

    }
})
}(angular))
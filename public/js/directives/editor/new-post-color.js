'use strict';
(function(angular){
    var AVAILABLE = [
        {label:'org color',className:'btn-primary btn-post'},
        {label:'blue',className:'btn-primary'},
        {label:'green',className:'btn-success'},
        {label:'red',className:'btn-danger'},
        {label:'white',className:'btn-default'},
        {label:'yellow',className:'btn-warning'}
    ];
    angular.module('app').directive('newPostColor',[function(){
        return {
            restrict: 'E',
            scope:{
                ngModel:'=?'
            },
            templateUrl:'/public/views/directives/editor/new-post-color.html',
            link:function(scope){
                scope.colors = AVAILABLE;
                scope.ngModel = scope.ngModel || AVAILABLE[0].className;
            }
        }
    }])
}(angular));
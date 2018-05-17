'use strict';
var app = angular.module('app');
app.config(
    ['$stateProvider',
        function($stateProvider) {
            $stateProvider
                .state('standard',{
                    url:'/:org_id/',
                    views:{
                        'menu@': {
                            templateUrl:'/public/views/standards/sidebar.html',
                            controller: 'StandardMenuController'
                        },
                        'content@' : {
                            template:'<p style="margin-top:4.5em"><span class="glyphicon glyphicon-arrow-left"></span> To add a new Standard use the menu on the left.</p>',
                            controller: 'StandardController'
                        }
                    }
                }).state('standard.create',{
                    url:'create',
                    views:{
                        'content@' : {
                            templateUrl:'/public/views/standards/content.html',
                            controller: 'StandardController'
                        }
                    }

                }).state('standard.edit',{
                    url:':id',
                    views:{
                        'content@' : {
                            templateUrl:'/public/views/standards/content.html',
                            controller: 'StandardController'
                        }
                    }
                })


    }]
);

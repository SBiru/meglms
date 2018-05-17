'use strict';
var app = angular.module('app.testbank');
app.config(
    ['$stateProvider','$urlRouterProvider',
        function($stateProvider,$urlRouterProvider) {
            $stateProvider
                .state('rubrics',{
                    parent: 'nav.course',
                    url:'rubrics',
                    views:{
                        'menu@':{
                            templateUrl:'/public/views/rubrics/sidebar.html',
                            controller:'RubricsMenuController'
                        },
                        'content@' : {
                            template:'<p style="margin-top:4.5em"><span class="glyphicon glyphicon-arrow-left"></span> To add a new Rubric use the menu on the left.</p>',
                        }

                    }
                })
                .state('rubrics.create', {
                    url:'/create',
                    views:{

                        'content@' : {
                            templateUrl:'/public/views/rubrics/content.html',
                            controller:'RubricsBaseController'
                        }
                    }
                })
                .state('rubrics.edit', {
                    url:'/:id',
                    views:{

                        'content@' : {
                            templateUrl:'/public/views/rubrics/content.html',
                            controller:'RubricsBaseController'
                        }
                    }
                });
            $urlRouterProvider.otherwise('');
        }]
);

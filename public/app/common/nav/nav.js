'use strict';

angular.module('app.nav', [
    'app.utils'
])


// https://github.com/angular-ui/ui-router/issues/151

.factory('courseNav', 
['$stateParams', '$http', '$q', 'nav','Class',
    function($stateParams, $http, $q, nav,Class) {
        
        var def = $q.defer();

        $q.all({
            courses:$http.get('/service.course/me/0'),
            banks:$http.get('/service.testbank.bank/get-by-org/0'),
            classes:Class.query({'as': 'edit_teacher'}).$promise

        }).
        then(function(response) {
            // replace all courses in nav service
            nav.courses = response.courses.data.courses
            nav.classes = response.classes;

            nav.allBanks = response.banks.data.banks;
            
            nav.allTests = response.courses.data.allTests;

            // select the default course
            if (!nav.selected_course) {
                /*
				Golabs 26/02/2015
				We will be selecting our course id we do this by checking out the cookies
				for the course id then find out where it is in the array....
				*/
                var name = "_course_id=";
                var courseid = ""
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ')
                        c = c.substring(1);
                    if (c.indexOf(name) == 0)
                        courseid = c.substring(name.length, c.length);
                }
                for (var i = 0; i < nav.courses.length;i++)
                {
                    if (nav.courses[i].id === courseid)
                    {
                        nav.selected_course = nav.courses[i];
                        break;
                    }
                }
                
                if (!nav.selected_course)
                nav.selected_course = nav.courses[0];
            }


            // resolve with a taste of nav's new data
            def.resolve({
                courses: nav.courses,
                selected_course: nav.selected_course
            });
        
        });
        
        return def.promise;
    
    }]
)


.config(
['$stateProvider', '$urlRouterProvider', 
    function($stateProvider, $urlRouterProvider) {
        
        $urlRouterProvider.otherwise('/');
        
        $stateProvider
        
        .state('nav', {
            url: '/',
            views: {
                
                'nav@': {
                    templateUrl: 'nav-standard.html',
                    resolve: {courseNav: 'courseNav'},
                    controller: ['$rootScope', '$scope', '$state', '$stateParams', 'courseNav', 'nav', 
                        function($rootScope, $scope, $state, $stateParams, courseNav, nav) {


                            //
                            // controller for main navigation view
                            //


                            // give this view 'a little more scope'
                            $scope.nav = nav;
                            $scope.courseNav = courseNav;


                            // this controller is inherited, so check current state before doing any redirection
                            if ($state.current.name == "nav") {



                            // if we have courses available, then goto the first one

                            /*if(nav.courses && nav.courses.length > 0) {
										nav.selected_course = nav.courses[0];
										$state.go('nav.course', {courseId: nav.courses[0].id});
									}*/

                            //$state.go('nav.course', {courseId: nav.selected_course.id});
                            
                            }
                        
                        
                        
                        }
                    ]
                }
            }
        
        })
        
        .state('nav.course', {
            url: '',
            views: {
                
                'course@': {
                    resolve: {courseNav: 'courseNav'},
                    controller: ['$rootScope', '$scope', '$state', '$stateParams', 'courseNav', 'nav', 
                        function($rootScope, $scope, $state, $stateParams, courseNav, nav) {


                            // give this view 'a little more scope'
                            $scope.nav = nav;
                            $scope.courseNav = courseNav;
                            
                            
                            console.log('[nav.course:course-controller]> ' + angular.toJson($stateParams));

                            // set the course params
                            nav.setSelectedCourseId($stateParams.courseId);


                            // broadcast that a navigational change has occured
                            $rootScope.$broadcast('NavUpdate', {course: nav.selected_course});


                            // this controller is inherited, so check current state before doing any redirection
                            if ($state.current.name == "nav.course") {

                            //
                            
                            }
                        
                        
                        }
                    ]
                }
            }
        
        
        })
    }]
)





.factory('NavService', ['$http', function($http) {
        
        return {
            
            'getOrganizations': function(user_id) {
                return $http.get('/organization/' + user_id);
            },
            
            'getDepartments': function(org_id) {
                return $http.get('/department/' + org_id);
            },
            
            'getCourses': function(user_id) {
                return $http.get('/course/' + user_id);
            }
        
        };
    }])

.controller('NavController', 
['$rootScope', '$scope', '$timeout', '$location', 'nav', 'NavService', 
    function($rootScope, $scope, $timeout, $location, nav, NavService) {

    // ...
    
    }]
);


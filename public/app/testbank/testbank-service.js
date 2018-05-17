angular.module('app.testbank.service', ['ngResource'])
    .factory('Vocab', ['$http', '$resource', function($http, $resource) {
        return {
            'all': function() {
                return $resource('/vocab/all').query;
            },
            details: function(data) {
                return $http.post('/vocab/details', data);
            },
            save: function(data) {
                return $http.post('/vocab/save', data);
            }
        }
    }])
    .factory('Timeout', ['$resource',
        function($resource) {
            return $resource('/timeout');
        }
    ])
    .factory('TestbankNavService', ['$http', function($http) {

        return {

            'getBanks': function(course_id) {
                return $http.get('/service.testbank.nav.banks/' + course_id);
            },

            'getTests': function(course_id) {
                return $http.get('/service.testbank.nav.tests/' + course_id);
            }
        };
    }]).factory('ShowDatesGrades', function() {
        return {
            show_dates: 1,
            show_grades: 1,
            setDates: function(show_dates) {
                this.show_dates = parseInt(show_dates);
            },
            getDates: function() {
                return parseInt(this.show_dates);
            },
            setGrades: function(show_grades) {
                this.show_grades = parseInt(show_grades);
            },
            getGrades: function() {
                return parseInt(this.show_grades);
            }
        }
    }).factory('Utility', ['$resource',
        function($resource) {
            return $resource('/utility/:userId', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            });
        }
    ]).factory('CurrentCourseId', function() {
        return {
            course_id: 0,
            setCourseId: function(id) {
                this.course_id = id;
            },
            getCourseId: function() {
                return this.course_id;
            }
        }
    })

    .factory('TestbankObjectiveService', ['$http', function($http) {

        var url = '/service.testbank.objective';
        return {

            'createFor': function(course_id, data) {
                return $http.post(url + '/create-for/' + course_id, data);
            },

            'rename': function(id, data) {
                return $http.post(url + '/rename/' + id, data);
            },

            'getByCourse': function(course_id) {
                return $http.get(url + '/get-by-course/' + course_id);
            }

        };
    }])
    .factory('Organization', ['$resource',
        function($resource) {
            return $resource('/organization/:userId', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            });
        }
    ])




    .factory('Preference', ['$resource',
        function($resource) {
            return $resource('/preference/:userId', {}, {
                query: {
                    method: 'GET'
                }
            });
        }
    ])

    .factory('User', ['$resource',
        function($resource) {
            return $resource('/user/:userId', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            });
        }
    ])

    .factory('Notification', ['$resource',
        function($resource) {
            return $resource('/notifications/:notificationId', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                },
                getNotificationGradePost: {
                    method: 'POST',
                    url: '/notifications/gradepost'
                }
            });
        }
    ])






    .factory('topMenuOptions', function() {
        return {
            menuOptions: {},
            set: function(menuOptions) {
                this.menuOptions = menuOptions;
            },
            get: function() {
                //return blank array if null or there is no lenth to our object.
                if (this.menuOptions === null) return [];
                if (typeof this.menuOptions[0] === 'undefined') return [];
                //good we have a object so lets give it to scope.
                return this.menuOptions;
            }
        }
    })



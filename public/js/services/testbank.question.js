'use strict';
(function(){
    try {
        var appServices = angular.module('app.testbank.service');
    } catch (err) {
        var appServices = angular.module('app.services');
    }
    appServices.factory('TestbankQuestionService', ['$http', '$window', '$resource', function($http, $window, $resource) {
        var clientWindow = angular.element($window),
            url = '/service.testbank.question';
        var resource = $resource('/api/questions', {}, {
            update: {
                method: 'PUT'
            }
        });
        return {
            'updateV2': resource.update,
            'createKlose': function(course_id, data) {
                return $http.post(url + '/create-klose/' + course_id, data);
            },

            'pagebreak': function(course_id, data) {
                return $http.post(url + '/page-break/' + course_id, data);
            },

            'wordmatching': function(course_id, data) {
                return $http.post(url + '/word-matching/' + course_id, data);
            },

            'multipartquestion': function(course_id, data) {
                return $http.post(url + '/multipartquestion/' + course_id, data);
            },

            'multipart': function(course_id, data) {
                return $http.post(url + '/multipartquestion/' + course_id, data);
            },
            'createFor': function(course_id, data) {
                return $http.post(url + '/create-for/' + course_id, data);
            },

            'rename': function(id, data) {
                return $http.post(url + '/rename/' + id, data);
            },

            'update': function(id, data) {
                return $http.post(url + '/update/' + id, data);
            },

            'delete': function(id, data) {
                return $http.post(url + '/delete/' + id, data);
            },

            'placequestions': function(id, data) {
                return $http.post(url + '/placequestions/' + id, data);
            },

            'bankcreateFor': function(course_id, data) {
                return $http.post('/service.testbank.bank' + '/create-for/' + course_id, data);
            },

            'movequestion': function(bankid, data) {
                return $http.post('/service.testbank.bank' + '/movequestion/' + bankid, data);
            },

            'bankdetails': function(id) {
                return $http.post('/service.testbank.bank' + '/details/' + id);
            },
            getHeight: function() {
                return clientWindow.innerHeight();
            },
            questionTypes: function() {
                return {
                    'single': {
                        label: 'Multiple Choice'
                    },
                    'oneword': {
                        label: 'One or multiple words answer'
                    },
                    'essay': {
                        label: 'Essay answer'
                    },
                    'multiple': {
                        label: 'Multiple answer to form a solution'
                    },
                    'blank': {
                        label: 'Fill in the blanks'
                    },
                    'truefalse': {
                        label: 'True or false'
                    },
                    'wordmatching': {
                        label: 'Word matching'
                    },
                    'matching': {
                        label: 'Image matching'
                    },
                    'studentvideoresponse': {
                        label: 'Student video response'
                    },
                    'multipart': {
                        label: 'Multipart question'
                    },
                    'information': {
                        label: 'Information'
                    },
                    'dragintotext': {
                        label: 'Drag and drop into text'
                    },
                    'random': {
                        label: 'Random'
                    },
                    'calculatedsimple': {
                        label: 'Simple calculated question'
                    },
                    'calculatedmulti': {
                        label: 'Multiple choice calculated question'
                    },
                    'equation': {
                        label: 'Equation Type Question'
                    },
                    'editingtask': {
                        label: 'Editing Task Items'
                    },
                    'grid': {
                        label : 'GRID Type Question'
                    },
                    'autograded': {
                        label : 'Auto-graded text entry'
                    }
                }
            }
        };
    }])
}())

'use strict';
(function(){
    try {
        var appServices = angular.module('app.testbank.service');
    } catch (err) {
        var appServices = angular.module('app.services');
    }
    appServices.factory('TestbankTestService', ['$http', '$resource', function($http, $resource) {

        var url = '/service.testbank.test';
        return {

            'createFor': function(course_id, data) {
                return $http.post(url + '/create-for/' + course_id, data);
            },

            'rename': function(id, data) {
                return $http.post(url + '/rename/' + id, data);
            },

            'details': function(id) {
                return $http.post(url + '/details/' + id);
            },
            'make_private': function(id, data) {
                return $http.post(url + '/make-private/' + id, data);
            },
            'make_survey': function(id, data) {
                return $http.post(url + '/make-survey/' + id, data);
            },
            'set_keep_highest': function(id, data) {
                return $http.post(url + '/set-keep-highest/' + id, data);
            },
            'set_sort_mode': function(id, data) {
                return $http.post(url + '/set-sort-mode/' + id, data);
            },
            'set_questions_per_page': function(id, data) {
                return $http.post(url + '/set-questions-per-page/' + id, data);
            },
            'getByOrg': function(id) {
                return $http.post(url + '/get-by-org/' + id);
            },
            getTests: $resource(url + '/all').get,
            'getByCourse': function(id) {
                return $http.post(url + '/get-by-course/' + id);
            },
            'cloneQuiz': function(id, data) {
                return $http.post(url + '/clone-quiz/' + id, data);
            },
            'randomQuiz': function(id, data) {
                return $http.post(url + '/random-quiz/' + id, data);
            },
            'quizList': function(id, data) {
                return $http.post(url + '/quiz-list/' + id, data);
            },
            'delete': function(id) {
                return $http.post(url + '/delete/' + id);
            },
            'pointsSpread': function(id, spread) {
                return $http.post(url + '/spread/' + id, spread);
            }
            ,
            'questionPositions': function(id, positions) {
                return $http.post(url + '/question-positions/' + id, positions);
            }
            ,
            'advancedSettings': function(id, settings) {
                return $http.post(url + '/advanced-settings/' + id, settings);
            }
        };
    }])
}())

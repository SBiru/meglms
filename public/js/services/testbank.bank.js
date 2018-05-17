'use strict';
(function(){
    try {
        var appServices = angular.module('app.testbank.service');
    } catch (err) {
        var appServices = angular.module('app.services');
    }
    appServices.factory('TestbankBankService', ['$http', function($http) {

        var url = '/service.testbank.bank';
        return {
            m_banks: [],
            setBanks: function(banks) {

                this.m_banks = banks;
            },
            getBanks: function() {
                return this.m_banks;
            },
            'createFor': function(course_id, data) {
                return $http.post(url + '/create-for/' + course_id, data);
            },

            'rename': function(id, data) {
                return $http.post(url + '/rename/' + id, data);
            },

            'details': function(id) {
                return $http.get(url + '/details/' + id);
            },

            'update': function(id, data) {
                return $http.post(url + '/update/' + id, data);
            },
            'getByOrg': function(id) {
                return $http.get(url + '/get-by-org/' + id);
            },
            'getByCourse': function(id) {
                return $http.get(url + '/get-by-course/' + id);
            },
            'delete': function(id) {
                return $http.post(url + '/delete/' + id);
            }

        };
    }])
}())

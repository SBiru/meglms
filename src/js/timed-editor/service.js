
angular.module('app.timed-editor.service', ['ngResource'])
.factory('TimedReviewService', ['$http', function($http) {
	 let url = '/timed_reviews/'
   return {
     'list': function() {
       return $http.get(url);
     },
     'details': function (id) {
       return $http.get(url + id);
     },
     'create': function(data) {
       return $http.post(url, data);
     },
     'delete': function(id, data) {
       return $http.delete(url + id);
     },
     'update': function(id, data) {
       return $http.post(url + id, data);
     },
   }
}]);




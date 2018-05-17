'use strict';

var appFilters = angular.module('app.filters', []);

appFilters.filter('startFrom', function() {
  return function(vocabItems, start) {
    if (!angular.isUndefined(vocabItems)) {
      return vocabItems.slice(start);
    }
  }
});

appFilters.filter('starFilter', function($rootScope) {
  return function (vocabItems, starred) {
    if (!angular.isUndefined(vocabItems) && !angular.isUndefined(starred) && starred.length > 0 && $rootScope.enableFilter) {
      var tempItems = [];
      angular.forEach(starred, function(id) {
        angular.forEach(vocabItems, function(vocab) {
          if (angular.equals(vocab.id, id)) {
            tempItems.push(vocab);
          }
        });
      });
      return tempItems;
    } else {
      return vocabItems;
    }
  }
});
appFilters.filter('slice', function() {
    return function(arr, start, end) {
       return arr?arr.slice(start, end):[];
    };
});
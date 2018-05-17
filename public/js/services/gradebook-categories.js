'use strict';

try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices
    .service('GradebookCategories',
    [
        '$resource',
        function( $resource){
            return $resource('/classes/:classId/gradebook/categories',{classId:'@classId'});
        }
    ])
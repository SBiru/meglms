try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices.factory('Powerschool', ['$resource',
    function ($resource) {
        return $resource('/ps_services/', {}, {
            getTeacherCourseStats:{
                url: '/ps_services/getTeacherCourseStats/'
            },
            getAdvisors: {
                url: '/ps_services/getAdvisors/'
            },
            linkAdvisorToUser: {
                method:'POST',
                url: '/ps_services/linkAdvisorToUser'
            },
            unlinkAdvisorAndUser: {
                method:'POST',
                url: '/ps_services/unlinkAdvisorAndUser'
            }
        });
    }
]);

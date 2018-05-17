angular.module('app').factory("ScormService",['$http','$resource',function($http, $resource){
    var url = '/ScormCloudController';
    return {

        'getUploadUrl': function(scormCourseId) {
            return $http.get(url + '/get-upload-url?courseid=' + scormCourseId);
        },
        'getUploadStatus': function(scormtokenid) {
            return $http.get(url + '/get-upload-status?id=' + scormtokenid);
        },
        'deleteCourse': function (scormCourseId) {
            return $http.get(url + '/delete-course?courseid=' + scormCourseId);
        },
        'getPreviewUrl': function (scormCourseId) {
            return $http.get(url + '/preview-url?courseid=' + scormCourseId);
        },
        'takeTest': function (scormCourseId, pageId, mail, firstName, lastName, userId) {
            return $http.get(url + '/take-test?courseId=' + scormCourseId + '&pageId=' + pageId + '&mail=' + mail + '&firstName=' + firstName + '&lastName=' + lastName + '&userId=' + userId);
        },
        'editAttripute': function (scormCourseId,attr,arrtval) {
            return $http.get(url + '/edit-attripute ?courseid=' + scormCourseId + '&attr=' + attr + '&attrval=' + arrtval);
        },
        'updateMark': function (pageId,scormCourseId,userId,userMail) {
            return $http.get(url + '/update-mark ?pageId=' + pageId + '&courseId=' + scormCourseId + '&userId=' + userId + '&mail=' + userMail);
        },
        'getMark': function (userId,pageId) {
            return $http.get(url + '/get-mark ?pageId=' + pageId + '&userId=' + userId);
        },


    };

}]);
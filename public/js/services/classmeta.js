var appServices = angular.module('app.services');
appServices.factory('ClassMeta',['$resource',function($resource){
    return $resource('/classmeta/', {classId:'@classId'}, {
        get:{
            url:'/classmeta/:classId/',
            method: 'GET'
        },
        save:{
            url:'/classmeta/:classId/',
            method: 'POST'
        },
        delete:{
            url:'/classmeta/:classId/',
            method: 'DELETE'
        }
    });
}]);
appServices.factory('ClassMetaData',['$q','ClassMeta',
    function($q,ClassMeta){
        return {
            data:{},
            getData : function(classid){
                if (classid > 0){
                var that = this;
                $q.all({
                    classmeta: ClassMeta.get({classId: classid}).$promise
                }).then(function(result){
                    if(angular.isDefined(result.classmeta.show_for_student))
                        result.classmeta.show_for_student.meta_value =result.classmeta.show_for_student.meta_value=='1';

                    that.data = result.classmeta;
                });
            }
            else{
                //that.data = {'':''};
            }
            }
        };
    }]);

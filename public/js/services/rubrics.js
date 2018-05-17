try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}

appServices.factory('Rubrics',['$resource',function($resource){
    return $resource('/rubrics/', {org_id:'@org_id',id:'@id'}, {
        getOrgRubrics:{
            url:'/api/organizations/:org_id/rubrics',
            method: 'GET'
        },
        query:{
            url:'/api/rubrics',
            method: 'GET',
            isArray:true
        },
        get:{
            url:'/rubrics/:id',
            method: 'GET'
        },
        create:{
            url:'/rubrics/:org_id/',
            method: 'POST'
        },
        update:{
            url:'/rubrics/:org_id/:id',
            method: 'POST'
        },
        delete:{
            url:'/rubrics/:id',
            method: 'DELETE'
        }
    });
}]);
appServices.factory('GradeRubric',['$resource',function($resource){
    var factory = {};
    factory.cachedRubrics = {};
    var resource = $resource('/rubric-grades', {}, {
        get:{
            method: 'GET'
        },
        save:{
            method: 'POST'
        }
    });
    function makeId(userid,postid){
        return postid + "-" + userid;
    }
    factory.setCachedScore= function(selectedScore,postid,userid){
        var id = makeId(userid,postid);
        this.cachedRubrics[id]=selectedScore;
    };
    factory.getCachedScore= function(postid,userid){
        var id = makeId(userid,postid);
        if(angular.isDefined(this.cachedRubrics[id]))
            return this.cachedRubrics[id];
        else return null;
    };
    factory.get = resource.get;
    factory.save = resource.save;

    return factory;
}]);
appServices.factory('RubricService', ['Rubrics',function (Rubrics) {
    return {
        data: {id:0,selected:0},
        initialData:{id:0,selected:0},
    }
}]);

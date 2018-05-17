'use strict';
(function(angular){
    angular.module('app').factory('TestSchoolsModel',['$resource','HelperService',function($resource,HelperService){
        var resource = $resource('/api/proficiency-test/school/:id',{id:'@id'},{
                getSchools:{
                    url:'/api/proficiency-test/school'
                }
            }),
            factory = {
                loading:{},
                selectedSchoolId:'new',
                selectedSchool:{id:'new',name:''}
            };
        factory.newSchool = function(){
            return {id:'new',name:''}
        }
        factory.getSchools = function(){
            runAsyncCall('getSchools',{},'schools',function(result){
                factory.schools = result.schools;
                factory.schoolsData = result;

            })
        }
        factory.removeSchool = function(params){
            runAsyncCall('delete',params,'deletingSchool',function(){
                var index = _.findIndex(factory.schools,{id:params.id})
                if(index>=0){
                    factory.schools.splice(index,1);
                }
            })
        }
        factory.getSchool = function(params,forceReload,cb){
            if(!params.id) throw "Invalid school id";
            factory.selectedSchool = null;

            var s = getSchoolReference(params.id);
            if(s.admins && !forceReload) {
                factory.selectedSchool = s;
                cb && cb()
                return;
            };

            runAsyncCall('get',params,'selectedSchool',function(school){
                _.extend(s,school);
                factory.selectedSchool = s;
                cb && cb()
            })
        }
        function getSchoolReference(id){
            var index = _.findIndex(factory.schools,{id:id});
            if(index<0) return null;
            return factory.schools[index];
        }

        factory.save = function(){
            delete factory.selectedSchool.editing;
            var params = {
                id:factory.selectedSchool.id,
                name:factory.selectedSchool.name,
                country:factory.selectedSchool.country,
                state:factory.selectedSchool.state,
            }
            runAsyncCall('save',params,'savingSchool',function(id){
                if(factory.selectedSchool.id=='new'){
                    factory.schools.push({id:id,name:factory.selectedSchool.name});
                    factory.selectedSchool.id = id;
                    factory.selectedSchoolId = id;
                }
                toastr.success("Saved");
            })
        }


        function runAsyncCall(method,params,loadingFlag,callBack){
            HelperService.runAsyncCall(
                resource[method],
                params,
                {obj:factory.loading,flag:loadingFlag},
                callBack
            );
        }
        return factory
    }])
}(angular));
'use strict';
(function(angular){
    angular.module('app').directive('testSubmitToSchool',['TestSchoolsModel','TestSchoolsSubmitted',function(TestSchoolsModel,TestSchoolsSubmitted){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/test-dashboard/modals/schools-to-submit.html?v='+window.currentJsVersion,
            scope:{
                classId:'=',
                userId:'=',
                cancel:'=?'
            },
            link:function(scope,el) {
                if(!checkRequiredFields()) return;

                function checkRequiredFields(){
                    return scope.classId && scope.userId;
                }

                function init(){
                    scope.schoolModel = TestSchoolsModel;
                    scope.schoolsToSubmit = [];
                    getSchools()
                }

                function getSchools(){
                    TestSchoolsModel.getSchools();
                }

                init();
                function countriesChanged(countries,oldVal){
                    if(!countries) return;
                    scope.countries = _.map(countries,function(c){return c});
                    scope.schools = [{name:"Select a state",isPlaceholder:true}];
                    scope.states = [{name:"Select a country"}];
                }
                function selectedCountryChanged(country,oldVal){
                    if(!country || country == oldVal) return;
                    scope.states = _.where(scope.schoolModel.schoolsData.states,{country:country.name});
                    scope.selectedState = null

                }
                function selectedStateChanged(state,oldVal){
                    if(!state || state == oldVal || !state.schools) return;
                    var schools = state.schools;
                    scope.schools = _.map(schools,function(sIndex){
                        return scope.schoolModel.schools[sIndex];
                    });
                    setTimeout(function(){
                        scope.$apply()
                    })
                }
                function selectedSchoolChanged(school,oldVal){
                    if(!school || school == oldVal || school.isPlaceholder) return;

                    var schoolIndex = scope.schoolsToSubmit.indexOf(school);
                    if(schoolIndex<0)
                        scope.schoolsToSubmit.push(school);
                    scope.schools.splice(scope.schools.indexOf(school),1);
                }
                scope.removeSchool = function(school){
                    scope.schoolsToSubmit.splice(scope.schoolsToSubmit.indexOf(school),1);
                    if(scope.selectedState == school.state)
                        scope.schools.push(school);
                }
                scope.submit = function(){
                    _.each(scope.schoolsToSubmit,function(school){
                        TestSchoolsSubmitted.save({
                            schoolId:school.id,
                            userId:scope.userId,
                            testId:scope.classId
                        });
                    })
                    scope.cancel();
                }

                var watchCountries = scope.$watch('schoolModel.schoolsData.countries',countriesChanged ,true);
                var watchCountry = scope.$watch('selectedCountry',selectedCountryChanged ,true);
                var watchState = scope.$watch('selectedState',selectedStateChanged,true);
                var watchSchool = scope.$watch('selectedSchool',selectedSchoolChanged,true);

                scope.$on('destroy',cleanup);
                function cleanup(){
                    watchCountries();
                    watchCountry();
                    watchState();
                    watchSchool();
                }

            }
        }
    }]);

}(angular))

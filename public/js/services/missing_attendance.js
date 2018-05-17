angular.module('app')
    .service('StudentsMissingAttendance',
    [	'$q',
        '$http',
        '$resource',
        function ($q, $http, $resource) {
            var students,
                loaded=false,
                loadPromise;
                resource = $resource('/api/attendance/missing/org/:orgId',{orgId:'@orgId'});
            function load(options,append){
                options = _.extend({orgId:0},options)
                loadPromise = resource.get(options).$promise
                loadPromise.then(handleLoadResponse.bind(this,append))
                loaded=true;
                return loadPromise;
            }
            function handleLoadResponse(append,res){
                if(!append  )
                    students = res;
                else{
                    students = _.extend({},students,res);
                }
            }
            function getStudents(){
                if(!loaded){
                    throw "Not loaded";
                }
                return students;
            }
            function isStudentMissingAttendance(id){
                return students && !_.isUndefined(students[id]);
            }
            return {
                load:load,
                isStudentMissingAttendance:isStudentMissingAttendance,
                getStudents:getStudents
            };
        }
    ]
)
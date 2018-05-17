appControllers.controller('TeacherResponseController', ['$scope','$http', '$modalInstance','Organization',
    function ($scope,$http, $modalInstance,Organization) {
        $scope.cancel = cancel;
        $scope.totalPostsPerType = totalPostsPerType;

        Organization.get({userId:'me'},function(res){
            var all = {id:0,name:'All'};
            res.organizations.splice(0,0,all);
            $scope.orgs=res.organizations
        });
        $scope.teachers=[];
        $scope.selected = {};

        $scope.$watch('[selected.org_id,selected.min_date,selected.max_date]',filterChanged,true);



        function cancel() {
            $modalInstance.dismiss('cancel');
        }
        function filterChanged(){
            if(
                $scope.selected &&
                angular.isDefined($scope.selected.org_id)&&
                $scope.selected.org_id!=null
            ){
                getTeachers($scope.selected.org_id);
            }
        }

        function getTeachers(orgId){
            $scope.loading=true;
            $scope.teachers=[];
            var params = '?';
            if($scope.selected.min_date)
                params+='min_date='+$scope.selected.min_date.toISOString().slice(0,10) + '&';
            if($scope.selected.max_date)
                params+='max_date='+$scope.selected.max_date.toISOString().slice(0,10) + '&';
            if($scope.selected.teacher_id){
                params+='user_id=' + $scope.selected.teacher_id+ '&';
            }

            params = params.substring(params, params.length - 1);
            $http.get('/api/teacher-responses/'+orgId+params).then(function(teachers){
                var all = {id:0,fname:'All'};
                teachers.data.splice(0,0,all);
                $scope.teachers = teachers.data;
                $scope.loading=false;

            });
        }
        function totalPostsPerType(teacher,type){
            var total = 0;
            for(var i in teacher.classes){
                var posts = teacher.classes[i].posts;
                total+= posts[type].length;
            }
            return total;
        }

    }
]);
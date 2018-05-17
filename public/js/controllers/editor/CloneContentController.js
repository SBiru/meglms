appControllers.controller('CloneContentController', ['$scope','EditPage','Course',
    function($scope,EditPage,Course){
        var getPages = function(by,data){
            var request = {};
            if(!angular.isDefined(by))
                by='course'
            if(by=='course'){
                var request = {
                    courseid:data.id
                }
            }
            $scope.loading_pages=true;
            EditPage.all(request,function(response){
                $scope.loading_pages=false;
                $scope.pages = response.pages;
            });
        };
        var getCourses = function (){
            $scope.loading_courses = true;
            Course.getTaught({},function(response){
                $scope.loading_courses = false;
                $scope.courses = response.courses;
            });
        };
        getCourses();

        $scope.finish = function(){
            var page = _.findWhere($scope.pages,{id:$scope.page});
            EditPage.get({
                pageId: page.id
            },function(p){
                    $scope.$emit('clonedInfo',p);
                }
            )
        }

        $scope.$watch('course',function(newValue){
            if(angular.isDefined(newValue) && newValue!=null){
                getPages('course',{id:newValue});
            }
        });
    }
]);
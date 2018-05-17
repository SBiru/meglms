(function(angular){
    angular.module('app').directive('seenBy',['$modal','PostViews',function($modal,PostViews){
        return {
            restrict:'E',
            template:'<span ng-click="open()"><span class="fa fa-check"></span> Seen by: {{message.views?message.views:0}}</span>',
            scope:{
                message:'=?'

            },
            link:function(scope){
                scope.open = function(){
                    if(!scope.message.views) return;
                    $modal.open({
                        'templateUrl':'/public/views/directives/seen-by-modal.html',
                        controller:function($scope){
                            $scope.loading = true;
                            PostViews.query({id:scope.message.id}).$promise.then(function(users){
                                $scope.users = users;
                                $scope.loading = false;
                            })

                        }
                    })
                }
            }
        }
    }])
        .service('PostViews',['$resource',function($resource){
            return $resource('/api/posts/:id/seen',{id:'@id'});
        }])
}(angular));
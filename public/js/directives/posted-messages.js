angular.module('app')

    .directive('postedMessages',
    [
        '$modal',
        'PostViews',
        function ($modal,PostViews) {
            return {
                restrict: 'E',
                scope: true,
                templateUrl:'/public/views/directives/posted-messages.html?v='+window.currentJsVersion,
                link:function(scope,element,attrs){
                    scope.is_archive = scope.$eval(attrs['isArchive']);
                    scope.videoClicked = function(message){
                        message.playVideo=true;
                        PostViews.save({id: message.id }).$promise.then(function(res){
                            if(res.affected)
                                message.views++;
                        });
                    };
                    scope.decodeURIComponent = function (uri) {
                      return decodeURIComponent(uri);
                    };
                    scope.openChat = function(message){
                        scope.$root.$broadcast('OpenChat',{userId:message.user_id});
                    };

                    scope.$root.$watch(attrs['messages'],function(messages){
                        scope.messages = messages;
                        var total = scope.messages.length;
                        if(total>25){
                            scope.pagConfig.perPageRange = [25];
                            if(total>50)
                                scope.pagConfig.perPageRange.push(50);
                            scope.pagConfig.perPageRange.push(total);
                        }
                        else delete scope.pagConfig.perPageRange;

                        scope.pagConfig.total = total;
                    })

                    scope.pagConfig = {
                        itemsPerPage: 25,
                        showOnTop:true,
                        showOnBottom:true,
                        showNav:true,

                    }


                }
            }
        }
    ]
);
app.directive('forumSettings', [
    function() {
        return {
            restrict:'E',
            templateUrl:'/public/views/partials/student/forum/editor_settings.html?v='+window.currentJsVersion,
            scope:{
                settings:'=?'
            },
            link:function(scope){

            }

        }
    }
]);
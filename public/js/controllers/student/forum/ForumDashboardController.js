appControllers.controller('ForumController', ['$state',
    function($state) {
        if($state.is('forum'))
            $state.go('forum.topics',{pageId:$state.params.contentId});

    }
]);
appControllers.controller('ForumDashboardController', ['$scope','Forum','$state','CurrentCourseId',
    function($scope,Forum,$state,CurrentCourseId) {
        var self = this;
        function reloadForums(){
            if($state.params.classId)
            Forum.query({classId:$state.params.classId}).$promise.then(function(forums){
                self.forums = forums
            })
        }
        setTimeout(function(){
            $scope.$root.pagename = CurrentCourseId.data.name + ' Forums';
            $scope.$apply();
        },200);

        reloadForums();
    }
]);

app.service('ForumUserSettings', ['$resource',function($resource){
    return $resource('/api/classes/0/forum/:forumId/settings/:userId',{forumId:'@forumId',userId:'@userId'});
}]);
app.service('ForumNotifications', ['$resource',function($resource){
    return $resource('/api/classes/:classId/forum/notifications',{forumId:'@forumId',classId:'@classId'});
}]);

appControllers.controller('ForumTopicDetailsController',['$scope','$state','Forum','Alerts',function($scope,$state,Forum,Alerts){
    var topicId = $state.params.topicId;
    var self = this;

    self.searchTerm = '';
    this.loadTopic = function(){
        Forum.loadTopic({classId:0,topicId:topicId}).$promise.then(function(data){
            self.topic = data.posts;
            self.settings = data.settings;
            self.userSettings = data.userSettings;
            $scope.$root.$emit('updateForumNotifications');
        })
    };

    self.hiddenTopics = {}
    this.onFilterChange = function(){
        self.hiddenTopics = {};
        doFilterTopic(self.topic);
    }
    function doFilterTopic(topic){
        var i = ".*" + self.searchTerm.replace(/ /g, ".*") + ".*";
        var containsMessage = topic.message && topic.message.match(new RegExp(i,"i")),
            containsAuthor = topic.author && topic.author.match(new RegExp(i,"i"))
        if(!(containsAuthor || containsMessage))
            self.hiddenTopics[topic.id]=true;
        _.each(topic.children,doFilterTopic);

    }

    this.loadTopic();

}]);

app.directive('forumTopicBox',['RecursionHelper','Forum','Alerts',function(RecursionHelper,Forum,Alerts){
    return {
        restrict:"E",
        templateUrl:'topic-box.html',
        scope:{
            topic:'=?',
            updateCallback:'=?',
            hiddenTopics:'=?',
            settings:'=?',
            isArchive:'=?'
        },
        controller:function($scope){

            resetReplyPost();
            $scope.vc = {};

            $scope.hasValidChild = function(topic){
                if(!topic.children) return false;
                for(var id in topic.children){
                    if(topic.children[id].is_deleted==='0' || $scope.hasValidChild(topic.children[id]))
                        return true;
                }
                return false
            }

            $scope.saveReply = function(){
                var endpoint = $scope.reply.id?'editPost':'savePost';
                $scope.reply.classId = '0';
                Forum[endpoint]($scope.reply).$promise.then(function(){
                    $scope.vc.replying = $scope.vc.editing = false;
                    resetReplyPost();
                    $scope.updateCallback && $scope.updateCallback()
                })
            };
            $scope.delete = function(post){
                Alerts.danger({
                    title: 'Delete forum post',
                    content:'Are you sure you want to delete this post?',
                    textOk: 'Save',
                    textCancel:'Cancel'
                },function(){
                    Forum.deletePost({id:post.id,classId:0}).$promise.then(function(){
                        $scope.updateCallback && $scope.updateCallback()
                    });
                });

            };

            function resetReplyPost(){
                $scope.replying = false;
                $scope.reply = {};
                $scope.reply.rootid = $scope.topic.rootid==="0"?$scope.topic.id:$scope.topic.rootid;
                $scope.reply.parentid = $scope.topic.id;
                $scope.reply.title = '';
                $scope.reply.message = '';
                $scope.reply.forumid = $scope.topic.forumid;

            }
        },
        compile:function(element){
            return RecursionHelper.compile(element);
        }
    }
}]);
app.directive('forumNotifications',[
    'CurrentCourseId',
    'ForumNotifications',
    '$templateCache',
    '$compile',
    'CurrentUnitId',
    'E3WsForum',
    function(CurrentCourseId,ForumNotifications,$templateCache,$compile,CurrentUnitId,ws){
    return {
        restrict:'E',
        templateUrl:'/public/views/partials/student/forum/notifications.html',
        link:function(scope,el){
            var vc = this;
            function init(){
                if(!ws.ready){
                    ws.init(scope.$root.e3Ws);
                    ws.registerCallback('update',loadNotifications)
                }

            }
            var currentClassId;
            var button = $(el).find('.forum-notification-btn');
            scope.courseData = CurrentCourseId;
            scope.showButton = false;
            scope.$watch('courseData',function(){
                var data = scope.courseData.data;
                if(currentClassId == data.class_id)
                    return;
                currentClassId = data.class_id;
                loadNotifications();
            },true);

            function loadNotifications(){
                scope.showButton = false;
                ForumNotifications.get({classId:currentClassId}).$promise.then(updateNotifications)
            }
            function updateNotifications(data){
                scope.showButton = data.useForum;
                scope.notifications = data.notifications;
                scope.count = data.notifications.length;
                scope.firstPageId = data.firstPageId;
                var template = $templateCache.get('forum-notifications-box.html');

                var compiled = $compile(template)(scope);
                setTimeout(function(){
                    popover.data('bs.popover').options.content = compiled[0].outerHTML;
                },100);
            }
            var popover;
            button.on('click',handleEvent);
            function handleEvent(){
                if(!popover)
                    createPopover();
            };
            createPopover();
            var isVisible = false;
            function createPopover(){
                popover = button.popover({
                    trigger: 'click',
                    html: true,
                    content: '<div><span class="fa fa-spinner fa-pulse"></span></div>',
                    placement: 'bottom',
                    container: 'body'
                }).on('click',function(){
                    if(scope.notifications && !scope.notifications.length){
                        button.popover('hide');
                        if(scope.firstPageId){
                            scope.$state.go('forum.dashboard',{'contentId':scope.firstPageId,classId:currentClassId});
                        }
                    }
                });

            }
            scope.goToForum = function(n){
                CurrentUnitId.setUnitId(n.unitid);
                scope.$state.go('forum',{contentId:n.pageid});
            };
            var unLinsten = scope.$root.$on('updateForumNotifications',loadNotifications);
            scope.$on("$destroy",function(){
                popover.popover('hide');
                popover && popover.popover('dispose');
                button.off('click', handleEvent);
                unLinsten();
            });

            if(!window.popoverClickSet){
                $(document).on('click', function (e) {
                    $('[data-toggle="popover"],[data-original-title]').each(function () {
                        //the 'is' for buttons that trigger popups
                        //the 'has' for icons within a button that triggers a popup
                        if (!$(this).is(e.target) && $(this).has(e.target).length === 0) {
                            (($(this).popover('hide').data('bs.popover')||{}).inState||{}).click = false
                        }
                    });
                });
                window.popoverClickSet = true;
            }
            init();
        }
    }
}]);

app.factory('RecursionHelper', ['$compile', function($compile){
    return {
        /**
         * Manually compiles the element, fixing the recursion loop.
         * @param element
         * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
         * @returns An object containing the linking functions.
         */
        compile: function(element, link){
            // Normalize the link parameter
            if(angular.isFunction(link)){
                link = { post: link };
            }

            // Break the recursion loop by removing the contents
            var contents = element.contents().remove();
            var compiledContents;
            return {
                pre: (link && link.pre) ? link.pre : null,
                /**
                 * Compiles and re-adds the contents
                 */
                post: function(scope, element){
                    // Compile the contents
                    if(!compiledContents){
                        compiledContents = $compile(contents);
                    }
                    // Re-add the compiled contents to the element
                    compiledContents(scope, function(clone){
                        element.append(clone);
                    });

                    // Call the post-linking function, if any
                    if(link && link.post){
                        link.post.apply(null, arguments);
                    }
                }
            };
        }
    };
}]);

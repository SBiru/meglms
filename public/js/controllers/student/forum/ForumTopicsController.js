
appControllers.controller('ForumTopicsController', ['$scope','$rootScope','$state','$modal','Forum','CurrentCourseId','ForumUserSettings',
    function($scope,$rootScope,$state,$modal,Forum,CurrentCourseId,ForumUserSettings) {
        var self = this,
            pageId = $state.params.pageId;

        this.modalInstance = null;
        reloadTopics();

        this.openCreateNew = function(){
            $modal.open({
                templateUrl:'new-topic-modal.html',
                controller:['$scope',function($scope){
                    this.newTopic = resetNewTopic();
                    this.postNewTopic = function(){
                        Forum.savePost(this.newTopic).$promise.then($scope.$close)
                    };
                }],
                controllerAs:'modalVC'
            }).result.then(function(){
                reloadTopics()
            })
        };
        this.openSettings = function(){
            $modal.open({
                templateUrl:'forum-settings-modal.html',
                controller:['$scope',function($scope){
                    $scope.userSettings = self.userSettings;
                    $scope.save = function(){
                        ForumUserSettings.save({
                            settings:$scope.userSettings,
                            userId:$rootScope.user.id,
                            forumId:self.forumId
                        }).$promise.then($scope.$dismiss);
                    };
                }],
                controllerAs:'modalVC'
            })
        };
        function resetNewTopic(){
            return {
                title:'',
                message:'',
                pageId:pageId,
                classId:0
            }
        }
        function reloadTopics(){
            Forum.loadTopics({pageId:pageId,classId:0}).$promise.then(function(data){
                self.topics = data.topics;
                self.userSettings = data.settings;
                self.forumSettings = data.forumSettings;
                self.forumId = data.forumId;
                createForum(data);
                $rootScope.pagename = data.forumName;
                $rootScope.$emit('updateForumNotifications');
            })
        }
        function createForum(data){
            switch (data.forumSettings.type){
                case 'q_a':
                    self.forum = new ForumQA(self);
                    break;
                case 'one_post':
                    self.forum = new ForumOnePost(self);
                    break;
                default:
                    self.forum = new ForumStandard(self);
            }

        }
        this.goToDashboard = function(){
            $state.go('forum.dashboard',{classId:CurrentCourseId.data.class_id});
        }

    }
]);
var ForumStandard = function(controller){
    this.controller = controller;
    this.newPostText = 'Add new discussion topic';
    this.topicsColName = 'TOPIC'
};
ForumStandard.prototype.canCreateNew = function(){
    return true;
};

var ForumOnePost = function(controller){
    ForumStandard.call(this,controller);
};
ForumOnePost.prototype = Object.create(ForumStandard.prototype);
ForumOnePost.prototype.constructor = ForumOnePost;
ForumOnePost.prototype.canCreateNew = function(){
    return !this.controller.userSettings.hasPosted
}

var ForumQA = function(controller){
    ForumStandard.call(this,controller);
    this.newPostText = 'Add a new question'
    this.topicsColName = 'QUESTION'
};
ForumQA.prototype = Object.create(ForumStandard.prototype);
ForumQA.prototype.constructor = ForumQA;
ForumQA.prototype.canCreateNew = function(){
    return this.controller.userSettings.isTeacher
}
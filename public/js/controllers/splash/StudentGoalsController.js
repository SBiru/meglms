appControllers.controller('StudentGoalsController',['$scope','$q','$modal','Goals',
    function($scope,$q,$modal,Goals){
        $scope.loading={}

        $scope.saveComment = saveComment;
        $scope.delete = deleteGoal;
        $scope.hideAddCommentBtn = hideAddCommentBtn;
        $scope.startEditingComment = startEditingComment;
        $scope.formatDate = formatDate;
        $scope.canCheckOff = canCheckOff;
        $scope.canAddComment = canAddComment;
        $scope.isOwner = isOwner;
        $scope.checkOff = checkOff;
        $scope.getCreatedBy = getCreatedBy;
        $scope.openModal = openModal;
        $scope.$root.goalsSidebarCollapsed = $scope.$root.windowWidth<768;
        $scope.$on('toggleSection',toggleSection);
        $scope.toggleSection = toggleSection;

        getGoals();

        $(window).resize(function () {
            if($(window).width()>767){
                $('.cat-dashboard-left').css({"transform": "translateX(0)"});
            } else{
                $('.cat-dashboard-left').css({"transform": "translateX(-100%)"});
                $scope.$root.goalsSidebarCollapsed = true;
            }
        });

        function toggleSection(){
            $scope.$root.goalsSidebarCollapsed = !$scope.$root.goalsSidebarCollapsed;
            var xValue = $scope.$root.goalsSidebarCollapsed?"-100%":"0";
            $('.cat-dashboard-left').css({"transform": "translateX("+xValue+")"});
        }

        function getGoals(){
            $scope.loading.goals=true;
            Goals.query({
                userId:'me'
            },function(goals){
                $scope.loading.goals=false;
                $scope.goals=goals;
            },function(error){
                $scope.loading.goals=false;
            })
        }
        function deleteGoal(goal){
            if(confirm("Are you sure you want to delete this goal?")){

                $scope.loading.delete=1
                Goals.delete({
                    userId:$scope.$root.user.id,
                    id:goal.id
                },function(ok){
                    var index;
                    for(var i = 0;i<$scope.goals.length;i++){
                        if($scope.goals[i].id==goal.id){
                            index=i;
                            break;
                        }
                    }
                    if(index!==undefined){
                        $scope.goals.splice(index,1);
                    }
                    $scope.loading.delete=0
                    goal.id=null;
                },function(error){
                    $scope.loading.delete=2
                });
            }
        }
        function formatDate(date){
            return moment(date).calendar();
        }
        function hideAddCommentBtn(goal){
            return typeof goal.editingComment=='string';
        }
        function startEditingComment(goal){
            goal.editingComment=goal.comment?angular.copy(goal.comment):''
        }
        function saveComment(goal){
            Goals.saveComment({
                userId:'me',
                id:goal.id,
                comment:goal.editingComment
            },function(ok){
                goal.comment=goal.editingComment;
                goal.editingComment=undefined;
            },function(error){}
            );
        }
        function checkOff(goal,unCheck){
            goal.completed=unCheck?false:true;
        }
        function isOwner(goal){

            return goal && goal.created_by == $scope.$root.user.id;
        }
        function canCheckOff(goal){
            return isOwner(goal);
        }
        function canAddComment(goal){
            return !isOwner(goal);
        }
        function getCreatedBy(goal){
            return goal.created_by == $scope.$root.user.id?'Me':goal.teacher;
        }
        function openModal(type, params) {
            var types = {
                goal: {
                    controller: 'PEModalGoalsController',
                    size: 'lg',
                    view: 'goal.html'
                },
            };
            var modalInstance = $modal.open({
                templateUrl: '/public/views/performance-evaluation/modal/' + types[type].view,
                controller: types[type].controller,
                size: types[type].size,
                resolve: {
                    params: function () {
                        return params;
                    }
                }
            });
            modalInstance.result.then(function(response) {
                getGoals();
            });

        };

    }
])
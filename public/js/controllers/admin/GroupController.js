appControllers.controller('GroupController', ['$scope','Group','CurrentGroupId',
    function($scope,Group,CurrentGroupId){
        $scope.newGroup={classid:$scope.classId};
        $scope.add = add;
        $scope.remove = remove;
        $scope.updateGroup = updateGroup;
        $scope.setStartDate = setStartDate;
        $scope.unsetStartDate = unsetStartDate;
        $scope.currentGroup = CurrentGroupId;
        CurrentGroupId.group_id=undefined;
        $scope.$watch('currentGroup',groupChanged,true);


        getGroups();


        function add(){

            if(!canAddGroup())
                return;

            Group.create($scope.newGroup,function(group){
                if(group.id){
                    $scope.groups.push(group);
                    CurrentGroupId.group_id = group.id;
                    $scope.newGroup.name="";
                }
            });
        }
        function getGroups(){
            $scope.groups = Group.query({classid:$scope.classId},function(groups){
                $scope.show_groups = groups.length>0;
                if(groups.length>0)
                    CurrentGroupId.group_id = groups[0].id;
                groups.forEach(function(g){
                    g.useStartDate = !_.isNull(g.start_date) && !_.isUndefined(g.start_date) && g.start_date.length>0;
                })
            });
        }

        function remove(){
            if(!canRemoveGroup())
                return;
            if(!confirm("Are you sure you want to delete "+ $scope.group.name +"?"))
                return;
            Group.remove($scope.group,function(res){
                if(res.status && res.status=='success'){
                    for(var i in $scope.groups){
                        if($scope.groups[i].id==$scope.group.id){
                            $scope.groups.splice(i,1);
                            break;
                        }
                    }
                }
            });
        }

        function updateGroup(group){
            Group.update(group);
        }
        function setStartDate(group){
            group.savingStartDate = true;
            Group.setStartDate(group).$promise.then(function(){
                group.savingStartDate = false;
            },function(){toastr.error("Something went wrong")});

        }
        function unsetStartDate(group){
            if(group.useStartDate || !group.start_date){
                return;
            }
            group.start_date = null;
            setStartDate(group)
        }
        function groupChanged(){
            var group;
            for(var i in $scope.groups){
                if($scope.groups[i].id == CurrentGroupId.group_id){
                    group=$scope.groups[i];
                    break;
                }
            }
            //$scope.$root.selected_group = $scope.selected_group;
            $scope.group=group;
        }
        function canAddGroup(){
            if($scope.users && $scope.users.length>0 && $scope.groups.length==0) {
                toastr.warning("You must withdraw all users before adding a group");
                return false;
            }
            return true;
        }
        function canRemoveGroup(){
            if($scope.users && $scope.users.length>0) {
                toastr.warning("You must withdraw all users before removing this group");
                return false;
            }
            return true;
        }

    }
]);
angular.module('app')
    .controller('PEModalGoalsController',
    [	'$scope',
        '$modalInstance',
        '$stateParams',
        'params',
        'Goals',
        function($scope, $modalInstance, $stateParams, params,Goals){
            $scope.params = params;
            $scope.loading = {};
            $scope.selected = {};
            $scope.datePicker = {};

            $scope.cancelEdit = cancelEdit;
            $scope.createNew = createNew;
            $scope.save = save;
            $scope.deleteGoal = deleteGoal;
            $scope.tableFilter = tableFilter;

            $scope.$watch('[goals,selected.tab]',filterGoals,true);


            getGoals();

            $scope.cancel = function () {
                $modalInstance.close('cancel');
            };
            function getGoals(){
                $scope.loading.goals = true;
                Goals.query({
                    userId:$scope.params.student.id
                },function(goals){
                    $scope.loading.goals = false;
                    $scope.goals = goals;
                },function(error){
                    $scope.loading.goals = false;
                })
            }
            function filterGoals(){
                $scope.filteredGoals = _.filter($scope.goals,tableFilter);
            }
            function markAsCompleted(goal){
                Goals.markAsCompleted({
                    id:goal.id,
                    userId:$scope.params.student.id,
                    completed:goal.completed
                })
            }
            function deleteGoal(goal){
                goal = goal || $scope.editing;
                if(confirm("Are you sure you want to delete this goal?")){

                    $scope.loading.delete=1
                    Goals.delete({
                        userId:$scope.params.student.id,
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
            function save(){
                var goal = angular.copy($scope.editing);
                goal.userId=$scope.params.student.id;
                $scope.loading.save=1
                Goals.save(goal,function(newGoal){
                    if(goal.id){
                        var index;
                        for(var i = 0;i<$scope.goals.length;i++){
                            if($scope.goals[i].id==goal.id){
                                index=i;
                                break;
                            }
                        }
                        if(index!==undefined){
                            $scope.goals[index]=newGoal;
                        }
                    }else{
                        $scope.goals.push(newGoal);
                    }
                    $scope.loading.save=0
                    cancelEdit();
                },function(error){
                    $scope.loading.save=2
                });
            }
            function startEditing(goal){
                $scope.editing=angular.copy(goal);
            }
            function createNew(){
                $scope.editing={
                    description:''
                };
            }
            function cancelEdit(){
                $scope.editing=null;
            }
            function tableFilter(el){
                if($scope.selected.tab==1){
                    return !el.completed
                }else if($scope.selected.tab==2){
                    return el.completed
                }else
                    return true;
            }
            function isOwner(goal){
                return goal.created_by==$scope.$root.user.id
            }
            function showTrashIcon(goal){
                if (!isStudent()) return true;
                return isOwner(goal);
            }
            function isStudent(){
                return $scope.params.isStudent;
            }
            $scope.tableHeader=[
                {id:'edit',label:'',functions:{startEditing:startEditing,showTrashIcon:showTrashIcon},rowTemplate:'<span class="fa fa-edit pointer" ng-show="functions.showTrashIcon(data)" data-ng-click="functions.startEditing(data)"></span>'},
                {id:'delete',label:'',functions:{delete:deleteGoal,showTrashIcon:showTrashIcon},rowTemplate:'<span class="fa fa-trash pointer" ng-show="functions.showTrashIcon(data)" data-ng-click="functions.delete(data)"></span>'},
                {id:'completed',label:'Completed',functions:{markAsCompleted:markAsCompleted,showTrashIcon:showTrashIcon},rowTemplate:'<input type="checkbox" data-ng-model="data.completed" ng-disabled="!functions.showTrashIcon(data)" data-ng-change="functions.markAsCompleted(data)">'},
                {id:'description',label:'Description'},
                {id:'teacher',label:'Created by'},
                {id:'created',label:'Created on'},
                {id:'expected_date',label:'Expected Date'}

            ]
            $scope.datePicker.open = function($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.datePicker.opened = true;
            };
            $scope.datePicker.dateOptions = {
                formatYear: 'yy',
            };
        }

    ]
)
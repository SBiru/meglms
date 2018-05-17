'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuOpen',['FabricActions','fabricMenus','fabricMenuOpenShared','canvasInstances','CurrentCourseId',function(FabricActions,fabricMenus,shared,canvasInstances,CurrentCourseId){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'open';

                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/open.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        var actions = FabricActions.getActionsFor(scope.instanceId);
                        $scope.selected = {}
                        $scope.filter = [{id:'class',value:CurrentCourseId.data.classId || CurrentCourseId.data.class_id}];
                        $scope.instanceId = scope.instanceId
                        $scope.config = canvasInstances[scope.instanceId];
                        $scope.useStudentFilter = $scope.config.config.useStudentFilter
                        shared.extend($scope);
                        $scope.open = function(){
                            actions.file.open($scope.selected.row);
                            $instance.dismiss();
                        }
                    }]
                }
            }
        }

    }]).factory('fabricMenuOpenShared',['fabricFileActions','FabricTemplatesApi','$filter','Alerts',function(fabricFileActions,api,$filter,Alerts){
        return {
            extend: function($scope){
                $scope.sort = {
                    by:'name',
                    reverse:false
                }
                function loadTemplates(filter){
                    filter = filter || $scope.filter;

                    if(!filter.length) return;
                    $scope.loading = true;
                    $scope.filter = filter;
                    fabricFileActions.loadAll({
                        filter:JSON.stringify(filter),
                        isPrivate:$scope.useStudentFilter
                    },function(templates){
                        $scope.loading = false;
                        $scope.templates = templates;
                        $scope.filteredTemplates = $scope.templates;
                        updateSortedTemplates($scope.sort)
                    })
                }
                $scope.edit = function(id,$event){
                    $event.stopPropagation()
                    $scope.selected.tab='edit'
                    $scope.selected.row=id
                }
                $scope.clone = function(id,$event){
                    $event.stopPropagation()
                    api.clone({id:id}).$promise.then(function(){
                        loadTemplates();
                    });
                }
                $scope.remove = function(id,$event){
                    $event.stopPropagation()
                    Alerts.warning({
                        title:'Delete template',
                        content:'Are you sure you want to delete this template',
                        textOk:'Ok',
                        textCancel:'Cancel'
                    },function(){
                        api.delete({id:id}).$promise.then(function(){
                            loadTemplates();
                        });
                    });


                }
                $scope.setSortBy = function(id){
                    if($scope.sort.by==id)
                        $scope.sort.reverse = !$scope.sort.reverse;
                    else{
                        $scope.sort.by = id;
                    }
                }

                $scope.$watch('sort', updateSortedTemplates,true)
                function updateSortedTemplates(sort){
                    if(!sort) return;
                    $scope.filteredTemplates = $filter('orderBy')($scope.filteredTemplates,sort.by,sort.reverse)
                }

                $scope.$watch('selected.filter',function(filter){
                    if(!filter)
                        $scope.filteredTemplates = $scope.templates;
                    else
                        $scope.filteredTemplates = $filter('filter')($scope.templates,filter);
                })

                $scope.onChangeFilter = loadTemplates;

                $scope.pagConfig = {showOnTop:false,showOnBottom:true,itemsPerPage:10};
            }
        }
    }]).directive('sortArrowIndicator',function(){
        return {
            restrict:'E',
            template:'<span class="fa" ng-class="arrowClass" ng-if="showArrow"></span>',
            scope:{
                sort:'=',
                sortId:'='
            },
            link:function(scope){
                scope.$watch('sort',function(){
                    if(!scope.sort){
                        scope.showArrow = false;
                        return;
                    }
                    if(scope.sort.by==scope.sortId){
                        scope.showArrow = true;
                        scope.arrowClass = scope.sort.reverse?'fa-long-arrow-down':'fa-long-arrow-up'
                        return;
                    }
                    scope.showArrow = false;
                },true)
            }
        }
    })
}(angular))

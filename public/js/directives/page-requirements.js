angular.module('app')


.directive('pageRequirements', [
    '$modal',
    function($modal){
        return {
            restrict: 'E',
            require: "?ngModel",
            scope:{
                classId:'=?',
                classData:'=?',
                allowSuperUnits:'=?'
            },
            templateUrl: '/public/views/directives/page-requirements/page-requirements.html',
            link: function (scope, element,attrs,ngModel) {

                scope.removePage = removePage;
                scope.openPageSelector = openPageSelector;

                function addPages(pages){
                    scope.selectedPages = pages
                    refreshModel();
                }
                function removePage(pageId){
                    var i;
                     scope.selectedPages.some(function(p,index){
                         if(p.id == pageId) i = index;
                        return p.id == pageId;
                    })
                    if(i>=0){
                        scope.selectedPages.splice(i,1);
                        refreshModel();
                    }
                }
                function refreshModel()
                {
                    ngModel.$setViewValue(scope.selectedPages);
                }
                scope.$watch(
                    function(){
                        return ngModel.$modelValue;
                    }, function(data, oldValue){
                        if(data){
                            scope.selectedPages=data;
                            var pageIds = _.map(data,function(p){return p.id});
                            _.each(scope.classData.units,function(u){
                                _.each(u.pages,function(p){
                                    var i = pageIds.indexOf(p.id)
                                    if(i >=0){
                                        p.selected=true;
                                        p.minimumCompletion = data[i].minimumCompletion
                                        scope.selectedPages[i].label = p.label
                                    }


                                })
                            });
                        }
                    });
                function openPageSelector(){
                    $modal.open({
                        controller:'PageSelectorController',
                        templateUrl:'/public/views/directives/page-requirements/modal-page-selector.html',
                        windowClass:'page-selector',
                        resolve:{
                            config:function(){return {
                                units: scope.classData.units,
                                allowSuperUnits:scope.allowSuperUnits,
                                selectedPages: scope.selectedPages
                            }}
                        }
                    }).result.then(addPages);
                }
            }
        }
    }
]).controller('PageSelectorController',['$scope','$modalInstance','config','SuperUnit','Nav',function($scope,$modalInstance,config,SuperUnit,Nav){
        $scope.selected={
            currentUnit : SuperUnit.currentUnit
        };
        var units = config.units;
        $scope.units = units;
        $scope.allowSuperUnits = config.allowSuperUnits
        $scope.superUnit = SuperUnit;
        $scope.cachedNavs = {};
        $scope.cachedNavs[Nav.courseId + '-' + Nav.superUnitId] = units;

        if(units.length)
            $scope.selected.unit = units[0];
        $scope.cancel=function(){
            $modalInstance.dismiss('cancel');
        }

        $scope.selectGroup = function(pages,groupId,isSelected){
            _.each(pages,function(p){
                if(p.header_id==groupId){
                    p.selected = isSelected;
                }
            })
        }
        $scope.close = function(){
            var selectedPages = [];
            _.each($scope.units,function(u){
                selectedPages= selectedPages.concat(_.filter(u.pages,function(p){
                    return p.selected && p.layout!= "header";
                }))
            });
            $modalInstance.close(selectedPages);
        }
        $scope.$watch('selected.currentUnit',function(unit,old){
            if(!unit 
                || angular.equals(unit,old)
            ) return;
            if($scope.cachedNavs[Nav.courseId + '-' + unit.id]){
                return changeSuperUnit($scope.cachedNavs[Nav.courseId + '-' + unit.id]);
            }
            Nav.getData(function(nav){
                $scope.cachedNavs[Nav.courseId + '-' + unit.id] = nav.units;
                return changeSuperUnit($scope.cachedNavs[Nav.courseId + '-' + unit.id]);
            },true,true,{
                doNotStore:true,
                superUnitId:unit.id
            })
        })
        function changeSuperUnit(units){
            fillSelectedPages(units)
            $scope.units = units;
            $scope.selected.unit = units[0];

        }
        function fillSelectedPages(units){
            var pageIds = _.map(config.selectedPages,function(p){return p.id});
            _.each(units,function(u){
                _.each(u.pages,function(p){
                    var i = pageIds.indexOf(p.id)
                    if(i >=0){
                        p.selected=true;
                        p.minimumCompletion = config.selectedPages[i].minimumCompletion
                    }
                })
            })

        }
    }])
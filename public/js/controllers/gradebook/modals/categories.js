'use strict';
(function(angular){

    angular.module('app').controller('GradebookModalCategoriesController',[
        '$scope',
        'GradebookCategories',
        'params',
        function($scope,GradebookCategories,params){

            function init(){
                loadCategories()
            }
            function loadCategories(){
                $scope.loading = true;
                GradebookCategories.query({
                    classId:params.classId
                }).$promise.then(function(c){
                    $scope.categories = c;
                    prepareAssignments(c)
                    $scope.loading = false;
                })
            }

            function prepareAssignments(categories){
                $scope.assignments = {};
                var categorized = getAllCategorizedAssignments(categories);
                $scope.uncategorized = {assignments: []};
                _.each(params.units,function(unit){
                    _.each(unit.pagegroups,function(pg){
                        _.each(pg.pages,function(page){
                            $scope.assignments[page.id] = {
                                id:page.id,
                                name:page.name
                            };
                            if(categorized.indexOf(page.id)<0)
                                $scope.uncategorized.assignments.push(page.id);
                        })
                    })
                })
            }
            function getAllCategorizedAssignments(categories){
                var pageIds = [];
                _.each(categories,function(c){
                    pageIds = pageIds.concat(c.assignments);
                })
                return pageIds;
            }
            $scope.categories = [];

            $scope.createNew = function(){
                $scope.categories.push({
                    'id':2,
                    'name':'New Category',
                    'points': Math.max(0,100 - sumAll()),
                    'assignments':[]
                })
            };
            $scope.removeCategory = function(index){
                var category = $scope.categories[index];
                $scope.uncategorized.assignments = $scope.uncategorized.assignments.concat(category.assignments);
                $scope.categories.splice(index,1);
            };
            $scope.save = function(){
                var error = hasError();
                if(error){
                    toastr.error(error.msg);
                    return;

                }
                $scope.saving = true;
                GradebookCategories.save({
                    classId:params.classId,
                    categories:$scope.categories
                }).$promise.then(function(){
                    $scope.saving = false;
                    updateUncategorizedCount();
                    params.recalculateFunction();
                    $scope.$dismiss();
                })
            };
            function hasError(){
                var total = 0;
                for(var i = 0;i<$scope.categories.length;i++){
                    var points = $scope.categories[i].points;
                    if(!isNumeric(points) || points<=0){
                        return {
                            'type':ErrorTypes.invalid,
                            'msg': $scope.categories[i].name + ' must have valid points'
                        }
                    }
                    total += parseInt(points);
                }
                if(total!=100){
                    return {
                        'type':ErrorTypes.non100,
                        'msg': 'Total points must add up to 100'
                    }
                }
            }
            function updateUncategorizedCount(){
                params.uncategorized.count = $scope.uncategorized.assignments.length;
            }
            function isNumeric(num){
                return !_.isNaN(parseInt(num));
            }
            function sumAll(){
                return _.reduce(_.map($scope.categories,function(cat){
                        return isNumeric(cat.points)?parseInt(cat.points):0
                    }),
                    function(memo,num){return memo + num},0)
            }
            $scope.sortableOptions = {
                handle: '> .category-info'
            };

            $scope.getSelectedItemsIncluding = function(list, item) {
                $scope.assignments[item].selected = true;
                var draggable = list.assignments.filter(function(item) { return $scope.assignments[item].selected; });
                if(draggable.length>1){
                    list.multiple = true;
                }
                return draggable
            };
            var img = new Image();
            img.src = '/public/img/ic_content_copy_black_24dp_2x.png';

            $scope.onDragstart = function(list, event) {
                list.dragging = true;
                if (list.multiple && event.dataTransfer.setDragImage) {
                    event.dataTransfer.setDragImage(img, 0, 0);
                }
            };
            var dropList = null
            $scope.onDrop = function(list, items, index) {


                list.assignments = list.assignments.slice(0, index)
                    .concat(items)
                    .concat(list.assignments.slice(index));
                list.insertedIndexes = _.range(index,index+items.length);
                list.multiple = false;
                dropList = list;
                return true;
            };

            $scope.onMoved = function(list) {
                console.log('moved',list);
                list.multiple = false;
                list.assignments = list.assignments.filter(function(item,index) {

                    return !$scope.assignments[item].selected || (dropList===list && list.insertedIndexes.indexOf(index)>=0);
                });
                angular.forEach($scope.assignments, function(item) { item.selected = false; });
            };
            init();
        }
    ]);
    var ErrorTypes  = {
        invalid:1,
        non100:2
    }


}(angular));

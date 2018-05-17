'use strict';
(function(angular){
    angular.module('app').directive("manageScoreRanges",
        ['ScoreRangesService','HelperService',function(ScoreRangesService,HelperService){
            return{
                restrict:'E',
                templateUrl:'/public/views/directives/admin/proficiency_score_ranges/manage_score_ranges.html?v='+window.currentJsVersion,
                scope:{
                    testId:'='
                },
                link:function(scope) {
                    var rangeValidator;
                    scope.loading = {};
                    function init(){
                        getCategories();
                    }
                    function getCategories(){
                        ScoreRangesService.query({includeLevels:true,testId:scope.testId}).$promise.then(function(categories){
                            if(!categories.length)
                                categories = [new DefaultCategory()];
                            scope.categories = _.sortBy(categories,'name');
                            validateCategories(categories);
                            rangeValidator = new RangeValidator(scope.categories,scope.levelChanged);
                            scope.validateRange = rangeValidator.validateRange;
                        })
                    }
                    function validateCategories(categories){
                        _.each(categories,function(cat){
                            if(!cat.ranges || !cat.ranges.length){
                                cat.ranges = [new DefaultLevel()]
                            }
                        })
                    }
                    scope.addCategory = function($index){
                        scope.categories.splice($index+1,0,new DefaultCategory());
                    }
                    scope.removeCategory = function($index){
                        var id = scope.categories[$index].id;
                        if(id){
                            runAsyncCall('remove',{id:id},'removeCategory')
                        }
                        scope.categories.splice($index,1);

                    }
                    scope.addLevel = function(category,$index){
                        var level = new DefaultLevel();
                        level.min = category.ranges[$index].max + 0.1
                        level.max = level.min + (category.ranges[$index].max - category.ranges[$index].min)
                        category.ranges.splice($index+1,0,level);
                    }
                    scope.removeLevel = function(category,$index){
                        var id = category.ranges[$index].id;
                        if(id)
                            runAsyncCall('removeLevel',{id:id},'removeLevel')
                        category.ranges.splice($index,1)
                        if(!category.ranges.length){
                            category.ranges.push(new DefaultLevel())
                        }
                    }
                    var levelChangeStatus = {}
                    scope.levelChanged = function(level,categoryId,skipMessage){
                        levelChangeStatus[level.id]= levelChangeStatus[level.id] || {};
                        clearLevelTimeout(level.id);
                        levelChangeStatus[level.id].timeout = setTimeout(function(){
                            saveLevel(level,categoryId,skipMessage);
                        },1000)
                    }
                    function clearLevelTimeout(id){
                        if(levelChangeStatus[id].timeout)
                            clearTimeout(levelChangeStatus[id].timeout);
                    }
                    function saveLevel(level,categoryId,skipMessage){
                        clearLevelTimeout(level.id);
                        runAsyncCall('saveLevel',_.extend({},level,{categoryId:categoryId}),'savingLevel',function(resp){
                            if(!skipMessage)
                                toastr.success("Saved!",'',{timeOut:1000});
                            level.id = resp.id;
                        });

                    }
                    var categoryChangeStatus = {}
                    scope.categoryChanged = function(category){
                        if(categoryChangeStatus.id && categoryChangeStatus.id != category.id)
                            saveCategory(categoryChangeStatus.category);
                        categoryChangeStatus.id = category.id
                        categoryChangeStatus.category = category;
                        clearCategoryTimeout();
                        categoryChangeStatus.timeout = setTimeout(function(){
                            saveCategory(category);
                        },1000)
                    }
                    function clearCategoryTimeout(){
                        if(categoryChangeStatus.timeout)
                            clearTimeout(categoryChangeStatus.timeout);
                    }
                    function saveCategory(category){
                        clearCategoryTimeout();
                        categoryChangeStatus = {};
                        runAsyncCall('save',{'id':category.id,'name':category.name,testId:scope.testId},'savingCategory',function(resp){
                            toastr.success("Saved!");
                            category.id = resp.id;
                        });
                    }

                    function runAsyncCall(method,params,loadingFlag,callBack){
                        HelperService.runAsyncCall(
                            ScoreRangesService[method],
                            params,
                            {obj:scope.loading,flag:loadingFlag},
                            callBack
                        );
                    }
                    init();

                }
            }
        }]
    )
    function RangeValidator(categories,changed){
        this.categories = categories;
        this.validateRange = function(attr,rangeIndex,categoryIndex,skipMessage){

            var category = this.categories[categoryIndex],
                val = category.ranges[rangeIndex][attr];
            if(val === '' || _.isNull(val) || _.isUndefined(val)) return;
            if(val<0){
                category.ranges[rangeIndex][attr] = 0;
                val = 0;
            }

            var nextBoxAttr = attr=='min'?'max':'min',
                nextBoxIndex = getNextBoxIndex(nextBoxAttr,rangeIndex,category),
                nextRange = category.ranges[nextBoxIndex],
                prevBoxIndex = getPrevBoxIndex(nextBoxAttr,rangeIndex),
                prevRange = category.ranges[prevBoxIndex]


            if(nextRange && nextRange[nextBoxAttr]<=val || (nextBoxIndex > rangeIndex && Math.round((nextRange[nextBoxAttr] - val)*100)/100 > 0.1) ){
                nextRange[nextBoxAttr]=val+0.1;
                this.validateRange(nextBoxAttr,nextBoxIndex,categoryIndex,true);
            }
            if(prevRange && prevRange[nextBoxAttr]>=val || (prevBoxIndex < rangeIndex && Math.round((val - prevRange[nextBoxAttr]) * 100)/100 > 0.1)){
                prevRange[nextBoxAttr]=val-0.1;
                this.validateRange(nextBoxAttr,prevBoxIndex,categoryIndex,true);
            }
            changed(category.ranges[rangeIndex],category.id,skipMessage);

        };
        function getNextBoxIndex(nextBoxAttr,rangeIndex,category){
            if(nextBoxAttr=='min' && category.ranges.length-1==rangeIndex)
                return null;
            return nextBoxAttr=='min'?rangeIndex+1:rangeIndex;
        }
        function getPrevBoxIndex(prevtBoxAttr,rangeIndex){
            if(prevtBoxAttr=='max' && 0==rangeIndex)
                return null;
            return prevtBoxAttr=='max'?rangeIndex-1:rangeIndex;
        }
    }
    function DefaultCategory(){
        return {
            name:'',
            ranges:[new DefaultLevel()]
        }
    }
    function DefaultLevel(){
        return {
            name:'',
            min:0,
            max:10,
            details:''
        }
    }
}(angular))
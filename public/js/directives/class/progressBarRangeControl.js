
angular.module('app').directive('progressBarRangeControl',[
'ProgressRangeService','$timeout',
function(ProgressRangeService,$timeout){
    return{
        restrict:'E',
        require:'ngModel',
        templateUrl:'/public/views/directives/class/progressBarRangeControl.html',
        scope:{
            isOpened:'=?'
        },
        link:function($scope,$element,$attrs,ngModel){
            $scope.cancel = function(){
                $scope.isOpened=false;
            }

            $scope.$watch('ranges',updateModel,true);

            function updateModel(){
                $timeout(function(){
                    ngModel.$setViewValue(convertRangesToArray())
                })
            }
            function convertRangesToArray(){
                var array = {};
                for(var i =0;i<$scope.ranges.length;i++){
                    array[$scope.ranges[i].name]=$scope.ranges[i].sliders
                }
                return array;
            }
            ngModel.$render = function () {
                onUpdateModelData();
            };
            function onUpdateModelData(){
                if(angular.isUndefinedOrNull(ngModel.$viewValue)){
                    $scope.ranges = defaults();
                }else{
                    parseModel(ngModel.$viewValue)
                }
            }
            function parseModel(model){
                $scope.ranges=[];
                for(var category in model){
                    $scope.ranges.push(
                        ProgressRangeService.getInstance(category,model[category])
                    )
                }
            }
            function defaults() {
                return [
                    ProgressRangeService.getInstance(
                        'Ahead',
                        [
                            {min: 0, max: 100, color: '#32CD32'}
                        ]
                    ),
                    ProgressRangeService.getInstance(
                        'Behind',
                        [
                            {min: 0, max: 20, color: '#F7F025'},
                            {min: 21, max: 50, color: '#F7A120'},
                            {min: 51, max: 100, color: '#FF0505'}
                        ]
                    )
                ];
            }


        }
    }
}
]).controller('ProgressRangeController',['$scope',function($scope){
   $scope.$watch('range.min',function(min){
       if(!angular.isUndefinedOrNull(min)){
           $scope.rangeCategory.moveMin($scope.$index);
       }
   })
   $scope.$watch('range.max',function(max){
       if(!angular.isUndefinedOrNull(max)){
           $scope.rangeCategory.moveMax($scope.$index);
       }
   })
}]).factory('ProgressRangeService',function(){
    var ProgressRanges = function(name,ranges){
        this.name = name;
        this.sliders=ranges;

    };
    function generateRandomColor(){
        return '#'+Math.floor(Math.random()*16777215).toString(16);
    }

    ProgressRanges.prototype.moveMin = function(sliderIndex){
        if(sliderIndex>0){
            this.sliders[sliderIndex-1].max = this.sliders[sliderIndex].min-1
        }else{
            this.sliders[sliderIndex].min=0;
        }
    }
    ProgressRanges.prototype.moveMax = function(sliderIndex){
        if(sliderIndex<this.sliders.length-1){
            this.sliders[sliderIndex+1].min = this.sliders[sliderIndex].max+1
        }else{
            this.sliders[sliderIndex].max=100;
        }
    }
    ProgressRanges.prototype.addSliderAfter = function(index){
        var min = this.sliders[index].max+1;
        var max = min+1;
        this.sliders.splice(index+1,0,{min:min,max:max,color:generateRandomColor()});
    }
    ProgressRanges.prototype.removeSlider = function(index){
        this.sliders.splice(index,1);
        this.sliders[this.sliders.length-1].max=100;
    }
    return {
        getInstance:function(name,ranges){
            return new ProgressRanges(name,ranges);
        }
    }
})

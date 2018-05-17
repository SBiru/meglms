appControllers.controller('ModeFilter',['$scope','GraderModes',function($scope,GraderModes){
    function changeNeedingGradeFilter(filter){
        if(filter=='needing'){
            window.location.href = '/grader/#/graderall/'+$scope.getCurrentCourseId()
        }else if(filter=='graded'){
            window.location.href = '/grader/#/graderarchive/'+$scope.getCurrentCourseId()
        }
    }
    $scope.$watch('graderData.needingGradeStateSelector',function(filter,oldFilter){
        if(filter == 'ignore' || oldFilter =='ignore') return;
        if(filter&& filter != oldFilter )
            changeNeedingGradeFilter(filter);
        else{
            $scope.graderData.needingGradeStateSelector = oldFilter
        }
    });
    $scope.$watch('navData.hasOnlyOnePage',function(flag){
        if(flag){

        }
    })
    var selectize;
    $scope.modeSelectizeConfig = {
        maxItems: 1,
        labelField: 'label',
        valueField:'id',
        placeholder:'Graded?',
        render:{
            item: function(item,escape) {
                var label = item.label;
                if(item.showCounter){

                    label = label + ' (' + item.counter + ')';
                }
                return '<div>' + escape(label) + '</div>';
            },
            option:  function(item,escape) {
                var label = item.label;
                if(item.showCounter){

                    label = label + ' (' + item.counter + ')';
                }
                return '<div>' + escape(label) + '</div>';
            }
        },
        onInitialize:function(s){
            $scope.graderData.selectize = s;
        },
        sortField: [
        {
            field: 'p',
            direction: 'asc'
        },
        {
            field: '$score'
        }
    ]
    }
}])
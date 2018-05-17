appControllers.controller('StudentFilter',['$scope','graderactivity','GraderData','GraderNav','CurrentCourseId',function($scope,graderactivity,GraderData,GraderNav,CurrentCourseId){
    $scope.applyStudentFilter = function(studentId){
        if(!studentId){
            studentId = 'all'
            $scope.graderData.currentSelectedStudentId = studentId;

        }
        if(studentId!='all'){
            graderactivity.applyStudentFilter2(studentId);
            updateStudentActivities(studentId)
        }
        else{
            graderactivity.applyStudentFilter2();
            $scope.visiblePages = undefined;
            updatePagesDisableStatus()
        }
    };
    $scope.graderData.updateStudentActivities = updateStudentActivities
    $scope.studentsSelectUpdateCallback = function(updateFn){
        GraderData.studentsSelectUpdate = updateFn;
    }
    function updateStudentActivities(studentId){
        var activitiesMethod = isArchive()?'archiveGradeForStudent':'needingGradeForStudent'
        GraderNav[activitiesMethod]({
            courseId: CurrentCourseId.getCourseId(),
            userId:studentId
        }).$promise.then(function(pages){
                $scope.visiblePages = pages;
                updatePagesDisableStatus(pages)
            })
    }
    function updatePagesDisableStatus(visiblePages){
        _.each($scope.pages,function(p){
            p.disabled = p.id != 'all' && !isVisible(p);
        })
        function isVisible(p){
            return _.isUndefined(visiblePages) || _.some(visiblePages,function(vp){
                    return p.id == vp.id
                })
        }
    }
    $scope.studentSelectConfig = {
        maxItems: 1,
        labelField: 'name',
        valueField:'user_id',
        searchField: ['name'],
        placeholder:'Select a student',
        plugins:{
            'option-disable':{}
        },
        sortField: [
            {
                field: 'name',
                direction: 'asc'
            },
            {
                field: '$score'
            }
        ]

    };
    function isArchive(){
        return window.location.href.indexOf("archive")>=0
    }
}])
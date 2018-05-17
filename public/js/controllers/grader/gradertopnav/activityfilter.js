appControllers.controller('ActivityFilter',['$scope','Currentpageid','CurrentCourseId','$filter',function($scope,Currentpageid,CurrentCourseId,$filter){
    var selectize;
    updatePageSelectizeConfig()
    function isArchive(){
        return window.location.href.indexOf("archive")>=0
    }

    $scope.goToPage = function(pageId){
        if(!pageId) return;
        if(pageId=='all'){
            window.location.href = '/grader/#/graderall/'+$scope.getCurrentCourseId()
            return
        }
        var page = _.find($scope.pages,function(p){return p.id == pageId});
        Currentpageid.SetCurrentpageid(pageId)
        window.location.href = '/grader/#/grader'+$scope.getGraderPageViewMode()+page.layout + '/' + page.id
    }

    function preparePages(){
        var pages = [];
        if(!($scope.navData && $scope.navData.units)) return pages;
        _.each($scope.navData.units,function(u){
            var unitPages = []
            _.each($filter('orderBy')(u.pages,'position'),function(p){
                var page = _.extend({},p);
                page.unit = u.id
                unitPages.push(page)
            });
            pages = pages.concat(unitPages);
        })
        updatePageSelectizeConfig()

        if(!isArchive()){
            var all ={
                id:'all',
                label:'All',
                position:-2,
                unitPosition:-2,
                count_needing_grading:$scope.total_count_needing_grading
            }
            pages.unshift(all)
        }

        return pages;
    }
    function updatePageSelectizeConfig(){
        $scope.pageSelectizeConfig = _.extend({},pageSelectizeConfig(),{
            optgroups: optgroups()
        })
    }
    function optgroups(){
        if(!($scope.navData && $scope.navData.units)) return [];
        return _.map($scope.navData.units,function(u){
            return {
                label:u.description,
                value: u.id
            }
        })
    }
    $scope.$watch('navData.units',function(){
        $scope.pages = preparePages()
        if($scope.pages.length==0)
            return $scope.selectedPageId = null;
        if($scope.pages.length==1 && isArchive()){
            $scope.goToPage($scope.pages[0].id);
            $scope.graderData.updateVisibleStudents(null,true);
            return;
        }
        if(isArchiveLandPage()){
            $scope.selectedPageId = ''
            selectize.showInput()
            $scope.graderData.updateVisibleStudents(null,true);
        }else{
            if(!isAllPageSelected())
                $scope.selectedPageId = Currentpageid.GetCurrentpageid();
            else{
                $scope.selectedPageId='all'
                $scope.graderData.updateVisibleStudents(null,true);
            }
        }

    },true)
    var currentNavCourse = null;

    $scope.$watch('$stateParams',function(params){
        if(angular.isObject(params)){
            if(currentNavCourse!=CurrentCourseId.getCourseId()){
                $scope.graderData.needingGradeStateSelector = 'needing'
            }
            if(!isAllPageSelected()){
                $scope.selectedPageId = params[Object.keys(params)[0]]
            }else{
                $scope.selectedPageId = 'all'
                $scope.graderData.updateVisibleStudents(null,true);
            }

            currentNavCourse = CurrentCourseId.getCourseId();
        }
    },true)
    function isAllPageSelected(){
        return  window.location.href.indexOf("graderall")>=0
    }
    function isArchiveLandPage(){
        return  window.location.href.indexOf("graderarchive")>=0
    }
    function pageSelectizeConfig(){
        function renderItem(item, escape) {
            var label = item.label;
            var counter = item.count_needing_grading || 0;
            return '<div>' +
                '<span>' + escape(label) + '</span><span style="padding-left:10px">(' +
                escape(counter) + ')</span>' +
                '</div>';
        }
        function renderOption(item, escape) {
            var label = item.label;
            var counter = item.count_needing_grading || 0;
            return '<div class="option">' +
                '<span>' + escape(label) + '</span><span style="float:right;">' +
                escape(counter) + '</span>' +
                '</div>';
        }
        return {
            maxItems: 1,
            optgroupField: 'unit',
            labelField: 'label',
            valueField:'id',
            searchField: ['label'],
            placeholder:'Select an activity',
            onInitialize:function(s){
                selectize = s
                window.selectize = s;
            },
            sortField: [
                {
                    field: 'unitPosition',
                    direction: 'asc'
                },
                {
                    field: 'position',
                    direction: 'asc'
                },
                {
                    field: '$score'
                }
            ],
            render: {
                optgroup_header: function(data, escape) {
                    var classes = "optgroup-header";
                    if(!_.isUndefined($scope.visiblePages) && !_.some($scope.visiblePages,function(vp){
                            return vp.unit_id==data.value;
                        })){
                        classes+=" selectize-disabled"
                    }
                    return '<div class="'+classes+'">' + escape(data.label) + '</div>';
                },
                option: renderOption,
                item:renderItem

            },
            plugins:{
                'option-disable':{}
            }

        };
    }
}])
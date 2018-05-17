function isActiveId($rootScope, id) {
    return (id === $rootScope.$stateParams.vocabId ||
    id === $rootScope.$stateParams.contentId ||
    id === $rootScope.$stateParams.quizId ||
    id === $rootScope.$stateParams.externalLinkId);
}

/**
 * GraderNavController is used to perform operations on the left sidebar
 */
appControllers.controller('GraderNavController', ['$rootScope', '$scope', '$timeout', '$location', 'GraderNav', 'CurrentUnitId', 'CurrentCourseId', 'EditPage', 'Currentpageid','Cookiecutter','GraderModes',
    function($rootScope, $scope, $timeout, $location, GraderNav, CurrentUnitId, CurrentCourseId, EditPage, Currentpageid,Cookiecutter,GraderModes) {
        $scope.navData = {};
        $scope.total_count_needing_grading = 0;
        $scope.archiveView = false;
        //$rootScope.sidebarCollapsed = true;//02/02/2015 Golabs collapsing side bar on entry.
        //if(Cookiecutter.getCookiebyname('course_id',true)>0){
        //    CurrentCourseId.setCourseId(Cookiecutter.getCookiebyname('courseid',true))
        //}

        if (CurrentCourseId.getCourseId() > 0) {
            reloadData(true);
        } else {
            $scope.navData = GraderNav.query({courseId: 0});
        }

        $scope.navPages = [];
        $scope.current_unit_id = 0;
        $scope.current_header_id = 0;

        CurrentUnitId.setUnitId($scope.current_unit_id);
        $scope.updateMenu = function (){
            $scope.$state.go('graderall',{courseId:CurrentCourseId.getCourseId()});
            reloadData(true)
        }
        $scope.$on('NavUpdate', function(event, data) {$scope.updateMenu()});
        $scope.$on('NavForceReload', function(event, data) {$scope.updateMenu()});


        $scope.$on('NavUpdateMenu', function(event, data) {
            reloadData(true)
        });

        $scope.$on('NavUpdateMenuStatic', function(event, data) {
            $scope.archiveView = false;
            reloadData()

        });
        function reloadData(changeToUnit){
            $scope.navData = GraderNav.query({courseId: CurrentCourseId.getCourseId()}, function(nav) {
                if (typeof nav.units !== 'undefined') {
                    if (nav.units.length > 0) {
                        var totalPages = 0;
                        if(changeToUnit)
                            $scope.changeToUnit(nav.units[0].id);
                        $scope.total_count_needing_grading = 0;
                        for (var j = 0; j < nav.units.length; j++) {
                            for (var k = 0; k < nav.units[j].pages.length; k++) {
                                $scope.total_count_needing_grading += parseInt(nav.units[j].pages[k].count_needing_grading);
                                totalPages ++;
                            }
                        }
                        if(totalPages===1){

                            getArchiveTotal(function(total){
                                $scope.totalArchiveCount =total
                                $scope.totalNeedingGrade = $scope.total_count_needing_grading;
                                updateGradeModes(true)
                            })

                        }

                    }

                }
            });
        }

        $scope.$on('GraderArchiveMenu', function() {
            $scope.archiveView = true;
            reloadArchive();
        });
        function getArchiveTotal(cb){
            GraderNav.archiveQuery({courseId: CurrentCourseId.getCourseId(),doNotUpdateUsers:1}, function(nav) {
                var total = 0;
                if ((typeof nav === 'object') && (typeof nav.units === 'object')){
                    if (nav.units.length > 0) {
                        total= 0;
                        for (var j = 0; j < nav.units.length; j++) {
                            for (var k = 0; k < nav.units[j].pages.length; k++) {
                                total+= parseInt(nav.units[j].pages[k].count_needing_grading);
                            }
                        }
                    }
                    cb && cb(total)
                }
            });
        }
        function getNeedingGradeTotal(cb){
            GraderNav.query({courseId: CurrentCourseId.getCourseId(),doNotUpdateUsers:1}, function(nav) {
                var total = 0;
                if (typeof nav.units !== 'undefined') {
                    if (nav.units.length > 0) {
                        total= 0;
                        for (var j = 0; j < nav.units.length; j++) {
                            for (var k = 0; k < nav.units[j].pages.length; k++) {
                                total+= parseInt(nav.units[j].pages[k].count_needing_grading);
                            }
                        }
                        cb && cb(total)
                    }
                }
            });
        }
        function reloadArchive(){
            $scope.navData = GraderNav.archiveQuery({courseId: CurrentCourseId.getCourseId()}, function(nav) {

                if ((typeof nav === 'object') && (typeof nav.units === 'object')){
                    if (nav.units.length > 0) {
                        // $scope.changeToUnit(nav.units[0].id);
                        $scope.total_count_needing_grading = 0;
                        var totalPages = 0
                        for (var j = 0; j < nav.units.length; j++) {
                            for (var k = 0; k < nav.units[j].pages.length; k++) {
                                $scope.total_count_needing_grading += parseInt(nav.units[j].pages[k].count_needing_grading);
                                totalPages ++;
                            }
                        }
                        if(totalPages===1){

                            getNeedingGradeTotal(function(total){
                                $scope.totalArchiveCount =$scope.total_count_needing_grading
                                $scope.totalNeedingGrade = total;
                                updateGradeModes(true)
                            })

                        }
                    }

                }
            });
        }
        function updateGradeModes(onlyOne){
            if(onlyOne){
                $scope.graderModes[0].showCounter = true;
                $scope.graderModes[1].showCounter = true;
                $scope.graderModes[0].counter = $scope.totalNeedingGrade;
                $scope.graderModes[1].counter = $scope.totalArchiveCount;
            }else{
                $scope.graderModes[0].showCounter = false;
                $scope.graderModes[1].showCounter = false;
            }
            $scope.graderData.selectize && $scope.graderData.selectize.clearCache();
            $scope.graderData.selectize && $scope.graderData.selectize.refreshItems();
            $scope.graderData.selectize && $scope.graderData.selectize.refreshOptions(false);
            var temp = $scope.graderData.needingGradeStateSelector;
            $scope.graderData.needingGradeStateSelector = 'ignore'
            setTimeout(function(){
                $scope.graderData.needingGradeStateSelector = temp
                $scope.$apply()
            });
        }
        $scope.showUnits = function() {
            if (angular.isDefined($scope.navData) && angular.isDefined($scope.navData.units) && angular.isDefined($scope.navData.units.length) && $scope.navData.units.length == 1) {
                return false;
            }

            return true;
        }

        $scope.changeToUnit = function(id) {
            if (typeof $scope.navData.units !== "object") {
                return
            }
            for (var i = 0; i < $scope.navData.units.length; i++) {
                if ($scope.navData.units[i].id == id) {
                    $scope.current_unit_id = id;
                    CurrentUnitId.setUnitId($scope.current_unit_id);
                    $scope.navPages = $scope.navData.units[i].pages;
                    if ($scope.navPages.length > 0) {
                        $location.url("\/grader" + $scope.navPages[0].layout + "\/" + $scope.navPages[0].id);
                    }
                }
            }
        }

        $scope.expandHeader = function(id) {
            console.log("Expand Header: " + id);

            for (var i = 0; i < $scope.navPages.length; i++) {
                if ($scope.navPages[i].id == id && $scope.navPages[i].layout == 'header') {
                    if ($scope.current_header_id == id) {
                        $scope.current_header_id = 0;
                    } else {
                        $scope.current_header_id = id;
                    }
                }
            }
        }

        $scope.isExpanded = function(id) {
            for (var i = 0; i < $scope.navPages.length; i++) {
                if ($scope.navPages[i].id == id) {
                    if ($scope.navPages[i].header_id == 0 || $scope.navPages[i].header_id == $scope.current_header_id || $scope.navPages[i].header_id == $scope.navPages[i].id) {
                        return true;
                    }
                }
            }

            return false;
        }

        $scope.isExternalLink = function(id) {
            for (var i = 0; i < $scope.navPages.length; i++) {
                if ($scope.navPages[i].id == id && $scope.navPages[i].layout == 'external_link') {
                    return true;
                }
            }

            return false;
        }

        $scope.isHeader = function(id) {
            for (var i = 0; i < $scope.navPages.length; i++) {
                if ($scope.navPages[i].id == id && $scope.navPages[i].layout == 'header') {
                    return true;
                }
            }

            return false;
        }

        $scope.isGrouped = function(id) {
            for (var i = 0; i < $scope.navPages.length; i++) {
                if ($scope.navPages[i].id == id && $scope.navPages[i].header_id > 0) {
                    return true;
                }
            }

            return false;
        }


        $scope.externalLinkClicked = function(id) {
            console.log("External Linked Clicked: " + id);

            for (var i = 0; i < $scope.navPages.length; i++) {
                if ($scope.navPages[i].id == id && $scope.navPages[i].layout == 'external_link') {
                    //$location.url("\/" + $scope.navPages[i].layout + "\/" + $scope.navPages[i].id);
                }
            }
        }


        $scope.isActive = function(id) {

            if(id=='all')
                return document.location.href.indexOf("graderall")>=0;
            return isActiveId($rootScope, id) ? 'active' : false;
        }


        $scope.getCurrentCourseId = function() {
            return CurrentCourseId.getCourseId();
        }

        $scope.GetCurrentpageid = function() {
            return Currentpageid.GetCurrentpageid();
        }

        $scope.getGraderAllViewMode = function() {
            if ($scope.archiveView) {
                return "archive"
            }
            return "all";
        }

        $scope.getGraderPageViewMode = function() {
            if ($scope.archiveView) {
                return "archive"
            }
            return "";
        }

        /*
         Golabs 30/01/2015
         Adding in our toggle for the side bar...
         */
        if($(window).width() <768){
            $rootScope.sidebarCollapsed = true;
        }
        $rootScope.toggleSidebar = function() {
            $rootScope.sidebarCollapsed = !$rootScope.sidebarCollapsed;
            var xValue = $rootScope.sidebarCollapsed?"-100%":"0";
            $('.sidebar').css({"transform": "translateX("+xValue+")"});
        }
    }
])

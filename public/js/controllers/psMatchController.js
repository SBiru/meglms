/**
 * Created by root on 2/13/17.
 */
appControllers.controller('psMatchController', ['$rootScope','$scope','$http','Alerts',
    function($rootScope,$scope,$http,Alerts) {

        $scope.isOpen = {
            saved: false
        };
        $scope.pending = null;
        $scope.rows = [];
        $scope.confirm_text = "";
        $scope.filter = {
            elms_search:"",
            ps_search:"",
            range:100,
            type:"all"
        };
        $scope.admin_opts = [];
        $scope.admin_opt = "";

        $scope.checkIfReady = function() {
            if($scope.$parent.userInformation) {
                $scope.userdata = $scope.$parent.userInformation;
                $scope.admin_opts = [
                    { id: $scope.userdata.id, fname:"My", lname:"Courses" },
                    { id: -1, fname:"All", lname:"Courses" }
                ];
                $scope.admin_opt = "My Courses";
                $scope.loadCourses($scope.userdata.id);
            }
            else {
                console.log("Not Ready");
                setTimeout(function () {
                    $scope.checkIfReady();
                }, 100);
            }
        };

        $scope.isEmpty = function(obj) {
            for(var key in obj) {
                if(obj.hasOwnProperty(key))
                    return false;
            }
            return true;
        };

        $scope.loadCourses =  function(userid) {
            $http({
                method: "POST",
                url: "../powerschool/load_LMS_map.php",
                headers: {
                    "accept":"application/json"
                },
                data: {
                    userid: userid
                }
            }).then(function (response) {
                var returnObj = response.data;
                if(returnObj.error) {
                    alert(returnObj.error);
                }
                else {
                    $scope.rows = returnObj;
                }
            });
        };
        $scope.fillAdminOpts = function() {
            $http({
                method: "GET",
                url: "../powerschool/getTeachers.php",
                headers: {
                    "accept":"application/json"
                }
            }).then(function (response) {
                $scope.admin_opts = $scope.admin_opts.concat(response.data);
            });
        };
        $scope.setAdminOpt = function(fname,lname) {
            $scope.admin_opt = fname + " " + lname;
        };
        $scope.setMatch = function(lmsid,name) {
            if(lmsid) {
                var sectionid = $scope.rows.ps_courses[$scope.pending].sectionid;
                var course_name = $scope.rows.ps_courses[$scope.pending].course_name;
                $http({
                    method: "POST",
                    url: "../powerschool/set_match.php",
                    data: {
                        sectionid: sectionid,
                        course_name: course_name,
                        lmsid: lmsid,
                        name: name,
                        usr_name: $scope.userdata.fname+" " +$scope.userdata.lname
                    }
                }).then(function () {
                        $scope.rows.ps_courses[$scope.pending].lmsid = lmsid;
                        $scope.rows.ps_courses[$scope.pending].name = name;
                        $scope.pending = null;
                        $("#select-match").toggle();
                        toastr.success(course_name + " linked to " + name);
                    },
                    function errorHandler(response) {
                        alert(response);
                    }
                );
            }
            else {
                alert("ERROR: lmsid is missing. Please contact an administrator to report the error.");
            }
        };
        $scope.unlink = function(x) {
            var sectionid = x.sectionid;
            var ps_course_name = x.course_name;
            var elms_course_name = x.name;
            $http({
                method: "POST",
                url: "../powerschool/unlink.php",
                data: {
                    sectionid: sectionid,
                    ps_course_name: ps_course_name,
                    elms_course_name: elms_course_name
                }
            }).then(function () {
                $scope.rows.ps_courses[x.index].lmsid = "";
                $scope.rows.ps_courses[x.index].name = "";
                toastr.info("Match erased for " + ps_course_name);
            });
        };
        $scope.elms_filter = function() {
            if($scope.filter.elms_search) {
                var return_obj = {};
                var filter = $scope.filter.elms_search.toLowerCase();
                var words = filter.split(" ");
                for (var key in $scope.rows.elms_courses) {
                    var course_name = $scope.rows.elms_courses[key].name.toLowerCase();
                    var count = 0;
                    for(i=0; i<words.length; i++) {
                        if (course_name.indexOf(words[i]) > -1) count++;
                    }
                    if(count == words.length) {
                        return_obj[key] = $scope.rows.elms_courses[key];
                    }
                }
                return return_obj;
            }
            return $scope.rows.elms_courses;
        };
        $scope.findSectionid = function(sectionid,array) {
            for(i=0;i<array.length;i++) {
                if(array[i].sectionid == sectionid) return i;
            }
            return -1;
        };
        $scope.ps_filter = function() {
            var return_arr = [];
            var filter = $scope.filter.ps_search.toLowerCase();
            var words = filter.split(" ");
            for (var key in $scope.rows.ps_courses) {
                console.log($scope.rows.ps_courses[key]);
                if($scope.filter.type == "att_u" && $scope.rows.ps_courses[key].attendance_only !== null) {
                    continue;
                }
                if ($scope.filter.type == "att_y" && $scope.rows.ps_courses[key].attendance_only != 1) {
                    continue;
                }
                if ($scope.filter.type == "att_n" && $scope.rows.ps_courses[key].attendance_only != 0) {
                    continue;
                }
                if($scope.filter.type == "mat_y" && ($scope.rows.ps_courses[key].attendance_only != 0 || !$scope.rows.ps_courses[key].lmsid)) {
                    continue;
                }
                if ($scope.filter.type == "mat_n" && ($scope.rows.ps_courses[key].attendance_only != 0 || $scope.rows.ps_courses[key].lmsid)) {
                    continue;
                }
                if(return_arr.length >= $scope.filter.range) return return_arr;
                if(words.length > 0) {
                    var course_name = $scope.rows.ps_courses[key].course_name.toLowerCase();
                    var count = 0;
                    for (i = 0; i < words.length; i++) {
                        if (course_name.indexOf(words[i]) > -1) count++;
                    }
                    if (count == words.length) {
                        return_arr.push($scope.rows.ps_courses[key]);
                    }
                }
                else {
                    return_arr.push($scope.rows.ps_courses[key]);
                }
            }
            return return_arr;
        };
        $scope.selectMatch = function(index) {
            $scope.pending = index;
            $("#select-match").toggle();
        };

        $scope.setFlag = function(index,value) {
            var target = $scope.rows.ps_courses[index];
            var str = (value == 1) ? "attendance only" : "NOT attendance only";
            Alerts.warning({
                title:'Set Attendance Type',
                content:'Are you sure you want to set ' + target.course_name + ' to ' + str + '?',
                textOk:'Ok'
            },function() {
                $http({
                    method: "POST",
                    url: "../powerschool/set_flag.php",
                    data: {
                        sectionid: target.sectionid,
                        course_name: target.course_name,
                        usr_name: $scope.userdata.fname + " " + $scope.userdata.lname,
                        value: value
                    }
                }).then(function () {
                        $scope.rows.ps_courses[index].attendance_only = value;
                        toastr.success(target.course_name + " set to " + str);
                    },
                    function errorHandler(response) {
                        console.log(response);
                    }
                );
            }
            );
        };

        $scope.toggleOpen = function(prop) {
            $scope.isOpen[prop] = $scope.isOpen[prop] ? false : true;
        };

        $scope.getNumRows = function() {
            return $scope.rows.ps_courses.length;
        }
    }
]);
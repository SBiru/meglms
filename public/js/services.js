'use strict';

try {
    var appServices = angular.module('app.testbank.service');
} catch (err) {
    var appServices = angular.module('app.services', ['ngResource']);
}
//appServices.factory('PreferredLanguage',function(){
//  return{
//    preferred_language:'',
//    setPreferredLanguage: function(language_id){
//
//    }
//  }
//});

appServices.factory('CurrentOrganizationId', ['Cookiecutter', function (Cookiecutter) {
    return {
        organization_id: 0,
        setOrganizationId: function (id) {
            this.organization_id = id;
            Cookiecutter.setcookie('organization_id', parseInt(id));
        },
        getOrganizationId: function () {
            return this.organization_id;
        }
    }
}]);

appServices.factory('CurrentDepartmentId', ['Cookiecutter', function (Cookiecutter) {
    return {
        department_id: 0,
        setDepartmentId: function (id) {
            this.department_id = id;
            Cookiecutter.setcookie('department_id', parseInt(id));
        },
        getDepartmentId: function () {
            return this.department_id;
        }
    }
}]);

appServices.factory('CurrentGroupId', ['Cookiecutter', function (Cookiecutter) {
    return {
        group_id: undefined
    }
}]);

appServices.factory('CurrentCourseId', ['Cookiecutter', function (Cookiecutter) {
    return {
        course_id: 0,
        data: {},
        setCourseInfo: function (data) {
            this.data = data;
        },
        setCourseId: function (id) {
            this.course_id = id;
            Cookiecutter.setcookie('course_id', id);
        },
        getCourseInfo: function () {
            return this.data;
        },
        getCourseId: function () {
            return this.course_id;
        },
        getCourseIdFromCookie: function () {
            this.course_id = Cookiecutter.getCookiebyname('course_id', true);
            return this.course_id
        }
    }
}]);
appServices.factory('CurrentSuperUnitId', ['Cookiecutter', function (Cookiecutter) {
    return {
        super_unit_id: 0,
        data: {},
        setInfo: function (data) {
            this.data = data;
            this.setId(data.id)
        },
        setId: function (id) {
            this.super_unit_id = id;
            if(id==0)
                this.clearCookie()
            else Cookiecutter.setcookie('super_unit_id', id);
        },
        getInfo: function () {
            return this.data;
        },
        getId: function () {
            return this.super_unit_id;
        },
        getIdFromCookie: function(){
            this.super_unit_id = Cookiecutter.getCookiebyname('super_unit_id', true);
            return this.super_unit_id
        },
        clearCookie: function(){
            Cookiecutter.delete_cookie('super_unit_id');
        }
    }
}]);

appServices.factory('CurrentClassId', ['Cookiecutter', function (Cookiecutter) {
    return {
        class_id: 0,
        setClassId: function (id) {
            this.class_id = id;
            Cookiecutter.setcookie('class_id', parseInt(id));
        },
        getClassId: function () {
            return this.class_id;
        }
    }
}]);
appServices.factory('CurrentTermId', ['Cookiecutter', function (Cookiecutter) {
    return {
        term_id: 0,
        setTermId: function (id) {
            this.term_id = id;
            Cookiecutter.setcookie('term_id', parseInt(id));
        },
        getTermId: function () {
            return this.term_id;
        }
    }
}]);

/*
 Golabs we want to set ShowDatesGrades as a object factory
 So we can call it as needed to use the value of
 */
appServices.factory('ShowDatesGrades', function () {
    return {
        show_dates: 1,
        show_grades: 1,
        show_grades_as_score: 1,
        show_grades_as_letter: 1,
        show_grades_as_percentage: 1,
        updateGradeScaleFromData: function (gradeScale, data) {
            for (var prop in gradeScale) {
                if (!angular.isDefined(gradeScale[prop]))
                    continue;
                if (gradeScale[prop].max) {
                    gradeScale[prop] = {
                        min: data[prop + "_min"],
                        max: data[prop + "_max"]
                    }
                } else {
                    gradeScale[prop] = data[prop];
                }
            }
        },
        // This sets the default grade scale for the system.
        gradeScale: {
            a_plus: {
                max: 100,
                min: 96,
                label: "A+"
            },
            a: {
                max: 95,
                min: 93,
                label: "A"
            },
            a_minus: {
                max: 92,
                min: 90,
                label: "A-"
            },
            b_plus: {
                max: 89,
                min: 86,
                label: "B+"
            },
            b: {
                max: 85,
                min: 83,
                label: "B"
            },
            b_minus: {
                max: 82,
                min: 80,
                label: "B-"
            },
            c_plus: {
                max: 79,
                min: 76,
                label: "C+"
            },
            c: {
                max: 75,
                min: 73,
                label: "C"
            },
            c_minus: {
                max: 72,
                min: 70,
                label: "C-"
            },
            d_plus: {
                max: 69,
                min: 66,
                label: "D+"
            },
            d: {
                max: 65,
                min: 63,
                label: "D"
            },
            d_minus: {
                max: 62,
                min: 60,
                label: "D-"
            },
            use_grade_a_plus: true,
            use_grade_a: true,
            use_grade_a_minus: true,
            use_grade_b_plus: true,
            use_grade_b: true,
            use_grade_b_minus: true,
            use_grade_c_plus: true,
            use_grade_c: true,
            use_grade_c_minus: true,
            use_grade_d_plus: true,
            use_grade_d: true,
            use_grade_d_minus: true
        },

        setDates: function (show_dates) {
            this.show_dates = parseInt(show_dates);
        },
        getDates: function () {
            return parseInt(this.show_dates);
        },
        setGrades: function (show_grades) {
            this.show_grades = parseInt(show_grades);
        },
        getGrades: function () {
            return parseInt(this.show_grades);
        },
        showDates: function () {
            if ($rootScope.currentCourse) return $rootScope.currentCourse.show_dates;
        },
        showGrades: function () {
            if ($rootScope.currentCourse) return $rootScope.currentCourse.show_grades;
        },
        setShowGradesAsScore: function (show_grades_as_score) {
            this.show_grades_as_score = parseInt(show_grades_as_score);
        },
        getShowGradesAsScore: function () {
            return parseInt(this.show_grades_as_score);
        },
        showGradesAsScore: function () {
            if ($rootScope.currentCourse) return $rootScope.currentCourse.show_grades_as_score;
        },
        setShowGradesAsLetter: function (show_grades_as_letter) {
            this.show_grades_as_letter = parseInt(show_grades_as_letter);
        },
        getShowGradesAsLetter: function () {
            return parseInt(this.show_grades_as_letter);
        },
        showGradesAsLetter: function () {
            if ($rootScope.currentCourse) return $rootScope.currentCourse.show_grades_as_letter;
        },
        setShowGradesAsPercentage: function (show_grades_as_percentage) {
            this.show_grades_as_percentage = parseInt(show_grades_as_percentage);
        },
        getShowGradesAsPercentage: function () {
            return parseInt(this.show_grades_as_percentage);
        },
        showGradesAsPercentage: function () {
            if ($rootScope.currentCourse) return $rootScope.currentCourse.show_grades_as_percentage;
        },
        getLetterGrade: function(rubric,percentage){
            var found = false;
            var letterGrade = "F";
            for( var i in rubric ){
                var letter = rubric[i];
                if(found) {
                    break;
                }
                if(letter['use'] && percentage >= letter['min']) {
                    letterGrade = letter['gradeLetter'];
                    found = true;
                }
            };
            return letterGrade;
        },
        /*
         initGradeScaleScopeVariables will set the initial values for the grading scale widget used in AddCourseClassController
         and EditCourseClassController.
         */
        initGradeScaleScopeVariables: function (scope) {
            scope.gradeScale = {};
            for (var param in this.gradeScale) {
                scope.gradeScale[param] = this.gradeScale[param];
            }
        },
        addGradeScaleVariablesToObject: function (object, scope) {
            for (var param in this.gradeScale) {
                if (scope.gradeScale[param].max) {
                    object[param + '_max'] = scope.gradeScale[param].max;
                    object[param + '_min'] = scope.gradeScale[param].min;
                } else {
                    object[param] = scope.gradeScale[param];
                }
            }
            return object;
        },
        /**
         * validateGradeScale() will validate a provided gradeScale object to make sure it has no grade ranges
         * overlap or any score possibilities that are not mapped to a grade letter. It will return an object
         * with two variables "errorFound" boolean and "errorMessage" string.
         * @param gradeScale
         * @returns Object {errorFound:true/false,errorMessage:"problem"}
         */
        validateGradeScale: function (gradeScale) {
            var rangesCoveredArray = [false], // An array of 100 booleans signifying covered percentage ranges
                errorFound = false,
                errorMessage = "";

            for (var i = 1; i <= 100; i++) {
                rangesCoveredArray[i] = false;
            }

            // Check for grade range overlap
            for (var param in gradeScale) {
                if (gradeScale[param].max) {
                    if (gradeScale["use_grade_" + param]) {
                        for (var i = gradeScale[param].min; i <= gradeScale[param].max; i++) {
                            if (rangesCoveredArray[i] == true) {
                                errorFound = true;
                                errorMessage = "Range overlap found. Make sure two grade letters do not cover the same range";
                            }
                            rangesCoveredArray[i] = true;
                        }
                    }
                }
            }

            var minimumGradeLetter = this.getMinimumGradeLetter(gradeScale);
            // Check for coverage across all score possibilities
            for (var i = minimumGradeLetter.min; i <= 100; i++) {
                if (rangesCoveredArray[i] == false) {
                    errorFound = true;
                    errorMessage = "Missing range found. Some percentage possibilities do not map to any grade letter. Please make sure all percentages from " + minimumGradeLetter.min + "% to 100% are mapped to a grade letter."
                }
            }

            return {
                errorFound: errorFound,
                errorMessage: errorMessage
            }
        },
        /**
         * getMinimumGradeLetter will return the lowest letter grade that is on the provided gradeScale.
         * Generally this means the gradeScale.d_minus object but if that is not selected it may be the gradeScale.d object
         * If even that is not selected, the method will continue up the list. If none are selected, it will return
         * gradeScale.a_plus
         *
         * @param gradeScale
         * @returns the grade letter ranges object for the lowest grade letter that is enabled.
         */
        getMinimumGradeLetter: function (gradeScale) {
            if (gradeScale.use_grade_d_minus) {
                return gradeScale.d_minus
            } else if (gradeScale.use_grade_d) {
                return gradeScale.d
            } else if (gradeScale.use_grade_d_plus) {
                return gradeScale.d_plus
            } else if (gradeScale.use_grade_c_minus) {
                return gradeScale.c_minus
            } else if (gradeScale.use_grade_c) {
                return gradeScale.c
            } else if (gradeScale.use_grade_c_plus) {
                return gradeScale.c_plus
            } else if (gradeScale.use_grade_b_minus) {
                return gradeScale.b_minus
            } else if (gradeScale.use_grade_b) {
                return gradeScale.b
            } else if (gradeScale.use_grade_b_plus) {
                return gradeScale.b_plus
            } else if (gradeScale.use_grade_a_minus) {
                return gradeScale.a_minus
            } else if (gradeScale.use_grade_a) {
                return gradeScale.a
            } else {
                return gradeScale.a_plus
            }
        },
        /*
         getGradeLetterString will return the grade letter string that the provided score falls under.
         @param score The score (number of points) that the user got
         @param maxPoints The total number of points possible for the assignment.
         */
        getGradeLetterString: function (percentage, gradeScale) {
            percentage = Math.ceil(percentage);
            //var percentage = (score/maxPoints)*100;
            if (gradeScale.use_grade_a_plus && percentage >= gradeScale.a_plus.min && percentage <= gradeScale.a_plus.max) {
                return gradeScale.a_plus.label
            } else if (gradeScale.use_grade_a && percentage >= gradeScale.a.min && percentage <= gradeScale.a.max) {
                return gradeScale.a.label
            } else if (gradeScale.use_grade_a_minus && percentage >= gradeScale.a_minus.min && percentage <= gradeScale.a_minus.max) {
                return gradeScale.a_minus.label
            } else if (gradeScale.use_grade_b_plus && percentage >= gradeScale.b_plus.min && percentage <= gradeScale.b_plus.max) {
                return gradeScale.b_plus.label
            } else if (gradeScale.use_grade_b && percentage >= gradeScale.b.min && percentage <= gradeScale.b.max) {
                return gradeScale.b.label
            } else if (gradeScale.use_grade_b_minus && percentage >= gradeScale.b_minus.min && percentage <= gradeScale.b_minus.max) {
                return gradeScale.b_minus.label
            } else if (gradeScale.use_grade_c_plus && percentage >= gradeScale.c_plus.min && percentage <= gradeScale.c_plus.max) {
                return gradeScale.c_plus.label
            } else if (gradeScale.use_grade_c && percentage >= gradeScale.c.min && percentage <= gradeScale.c.max) {
                return gradeScale.c.label
            } else if (gradeScale.use_grade_c_minus && percentage >= gradeScale.c_minus.min && percentage <= gradeScale.c_minus.max) {
                return gradeScale.c_minus.label
            } else if (gradeScale.use_grade_d_plus && percentage >= gradeScale.d_plus.min && percentage <= gradeScale.d_plus.max) {
                return gradeScale.d_plus.label
            } else if (gradeScale.use_grade_d && percentage >= gradeScale.d.min && percentage <= gradeScale.d.max) {
                return gradeScale.d.label
            } else if (gradeScale.use_grade_d_minus && percentage >= gradeScale.d_minus.min && percentage <= gradeScale.d_minus.max) {
                return gradeScale.d_minus.label
            } else {
                return "F"
            };
        },
        /**
         * compensateForGradeLetterUseChange() will attempt to automatically adjust adjacent grade letters on the grade scale widget when a
         * grade letter symbol is removed.
         *
         * @param gradeScale
         * @param letter_name
         */
        compensateForGradeLetterUseChange: function (gradeScale, letter_name) {
            // Handle the case that the grade letter is being added.
            if (gradeScale[letter_name]) {
                switch (letter_name) {
                    case 'use_grade_a_plus':
                        gradeScale.a_plus.max = 100;
                        gradeScale.a_plus.min = 96;
                        gradeScale.a.max = 95;
                        break;
                    case 'use_grade_a':
                        gradeScale.a.min = 93;
                        gradeScale.a.max = 95;
                        gradeScale.a_minus.max = 92;
                        break;
                    case 'use_grade_a_minus':
                        gradeScale.a_minus.min = 90;
                        gradeScale.a_minus.max = 92;
                        gradeScale.b_plus.max = 89;
                        break;
                    case 'use_grade_b_plus':
                        gradeScale.b_plus.max = 89;
                        gradeScale.b_plus.min = 86;
                        gradeScale.b.max = 85;
                        break;
                    case 'use_grade_b':
                        gradeScale.b.min = 83;
                        gradeScale.b.max = 85;
                        gradeScale.b_minus.max = 82;
                        break;
                    case 'use_grade_b_minus':
                        gradeScale.b_minus.min = 80;
                        gradeScale.b_minus.max = 82;
                        gradeScale.c_plus.max = 79;
                        break;
                    case 'use_grade_c_plus':
                        gradeScale.c_plus.max = 79;
                        gradeScale.c_plus.min = 76;
                        gradeScale.c.max = 75;
                        break;
                    case 'use_grade_c':
                        gradeScale.c.min = 73;
                        gradeScale.c.max = 75;
                        gradeScale.c_minus.max = 72;
                        break;
                    case 'use_grade_c_minus':
                        gradeScale.c_minus.min = 70;
                        gradeScale.c_minus.max = 72;
                        gradeScale.d_plus.max = 69;
                        break;
                    case 'use_grade_d_plus':
                        gradeScale.d_plus.max = 69;
                        gradeScale.d_plus.min = 66;
                        gradeScale.d.max = 65;
                        break;
                    case 'use_grade_d':
                        gradeScale.d.min = 63;
                        gradeScale.d.max = 65;
                        gradeScale.d_minus.max = 62;
                        break;
                    case 'use_grade_d_minus':
                        gradeScale.d_minus.min = 60;
                        gradeScale.d_minus.max = 62;
                        break;
                }
            }
            // Handle the case that the grade letter is being removed.
            else {
                switch (letter_name) {
                    case 'use_grade_a_plus':
                        gradeScale.a.max = gradeScale.a_plus.max;
                        break;
                    case 'use_grade_a':
                        gradeScale.a_minus.max = gradeScale.a.max;
                        break;
                    case 'use_grade_a_minus':
                        gradeScale.a.min = gradeScale.a_minus.min;
                        break;
                    case 'use_grade_b_plus':
                        gradeScale.b.max = gradeScale.b_plus.max;
                        break;
                    case 'use_grade_b':
                        gradeScale.b_minus.max = gradeScale.b.max;
                        break;
                    case 'use_grade_b_minus':
                        gradeScale.b.min = gradeScale.b_minus.min;
                        break;
                    case 'use_grade_c_plus':
                        gradeScale.c.max = gradeScale.c_plus.max;
                        break;
                    case 'use_grade_c':
                        gradeScale.c_minus.max = gradeScale.c.max;
                        break;
                    case 'use_grade_c_minus':
                        gradeScale.c.min = gradeScale.c_minus.min;
                        break;
                    case 'use_grade_d_plus':
                        gradeScale.d.max = gradeScale.d_plus.max;
                        break;
                    case 'use_grade_d':
                        gradeScale.d_minus.max = gradeScale.d.max;
                        break;
                    case 'use_grade_d_minus':
                        gradeScale.d.min = gradeScale.d_minus.min;
                        break;
                }
            }
        }
        //,
        //setAPlusMax: function(a_plus_max){this.a_plus_max = parseInt(a_plus_max);},
        //setAPlusMin: function(a_plus_min){this.a_plus_min = parseInt(a_plus_min);},
        //setAMax: function(a_max){this.a_max = parseInt(a_max);},
        //setAMin: function(a_min){this.a_min = parseInt(a_min);},
        //setAMinusMax: function(a_minus_max){this.a_minus_max = parseInt(a_minus_max);},
        //setAMinusMin: function(a_minus_min){this.a_minus_min = parseInt(a_minus_min);},
        //setBPlusMax: function(b_plus_max){this.b_plus_max = parseInt(b_plus_max);},
        //setBPlusMin: function(b_plus_min){this.b_plus_min = parseInt(b_plus_min);},
        //setBMax: function(b_max){this.b_max = parseInt(b_max);},
        //setBMin: function(b_min){this.b_min = parseInt(b_min);},
        //setBMinusMax: function(b_minus_max){this.b_minus_max = parseInt(b_minus_max);},
        //setBMinusMin: function(b_minus_min){this.b_minus_min = parseInt(b_minus_min);},
        //setCPlusMax: function(c_plus_max){this.c_plus_max = parseInt(c_plus_max);},
        //setCPlusMin: function(c_plus_min){this.c_plus_min = parseInt(c_plus_min);},
        //setCMax: function(c_max){this.c_max = parseInt(c_max);},
        //setCMin: function(c_min){this.c_min = parseInt(c_min);},
        //setCMinusMax: function(c_minus_max){this.c_minus_max = parseInt(c_minus_max);},
        //setCMinusMin: function(c_minus_min){this.c_minus_min = parseInt(c_minus_min);},
        //setDPlusMax: function(d_plus_max){this.d_plus_max = parseInt(d_plus_max);},
        //setDPlusMin: function(d_plus_min){this.d_plus_min = parseInt(d_plus_min);},
        //setDMax: function(d_max){this.d_max = parseInt(d_max);},
        //setDMin: function(d_min){this.d_min = parseInt(d_min);},
        //setDMinusMax: function(d_minus_max){this.d_minus_max = parseInt(d_minus_max);},
        //setDMinusMin: function(d_minus_min){this.d_minus_min = parseInt(d_minus_min);},
        //getAPlusMax: function(){return parseInt(this.a_plus_max);},
        //getAPlusMin: function(){return parseInt(this.a_plus_min);},
        //getAMax: function(){return parseInt(this.a_max);},
        //getAMin: function(){return parseInt(this.a_min);},
        //getAMinusMax: function(){return parseInt(this.a_minus_max);},
        //getAMinusMin: function(){return parseInt(this.a_minus_min);},
        //getBPlusMax: function(){return parseInt(this.b_plus_max);},
        //getBPlusMin: function(){return parseInt(this.b_plus_min);},
        //getBMax: function(){return parseInt(this.b_max);},
        //getBMin: function(){return parseInt(this.b_min);},
        //getBMinusMax: function(){return parseInt(this.b_minus_max);},
        //getBMinusMin: function(){return parseInt(this.b_minus_min);},
        //getCPlusMax: function(){return parseInt(this.c_plus_max);},
        //getCPlusMin: function(){return parseInt(this.c_plus_min);},
        //getCMax: function(){return parseInt(this.c_max);},
        //getCMin: function(){return parseInt(this.c_min);},
        //getCMinusMax: function(){return parseInt(this.c_minus_max);},
        //getCMinusMin: function(){return parseInt(this.c_minus_min);},
        //getDPlusMax: function(){return parseInt(this.d_plus_max);},
        //getDPlusMin: function(){return parseInt(this.d_plus_min);},
        //getDMax: function(){return parseInt(this.d_max);},
        //getDMin: function(){return parseInt(this.d_min);},
        //getDMinusMax: function(){return parseInt(this.d_minus_max);},
        //getDMinusMin: function(){return parseInt(this.d_minus_min);},
    }
});

appServices.factory('GradeScale', function () {
    return {
        show_dates: 1,
        show_grades: 1,
        show_grades_as_score: 1,
        show_grades_as_letter: 1,
        show_grades_as_percentage: 1

    }
});

appServices.factory('CurrentHeaderId', function () {
    return {
        header_id: 0,
        set: function (id) {
            this.header_id = id;
        },
        get: function () {
            return this.header_id;
        }
    }
});

appServices.factory('CurrentUnitId', ['Cookiecutter', function (Cookiecutter) {
    return {
        unit_id: 0,
        setLast: function (val) {
            this.last = val
        },
        getLast: function () {
            return this.last
        },
        setUnitId: function (id) {
            this.unit_id = id;
            /*
             Golabs 23/01/2015
             We do not want to carry the course in a db table so
             we will make a cookie of it since so we then user comes back
             The will begin where they left off.
             */
            Cookiecutter.setcookie('unit_id', parseInt(id))
        },
        getUnitId: function () {
            return this.unit_id;
        },
        getFromCookie: function () {
            this.unit_id = Cookiecutter.getCookiebyname('unit_id', true);
            return this.unit_id
        }
    }
}]);

/*
 Golabs 02/02/2015
 Setting our topMenuOptions options for scope capture.
 We need a way of capturing our top menu and setting
 */
appServices.factory('topMenuOptions', function () {
    return {
        menuOptions: {},
        set: function (menuOptions) {
            this.menuOptions = menuOptions;
        },
        get: function () {
            //return blank array if null or there is no lenth to our object.
            if (this.menuOptions === null) return [];
            if (typeof this.menuOptions[0] === 'undefined') return [];
            //good we have a object so lets give it to scope.
            return this.menuOptions;
        }
    }
});

/*
 Golabs 26/01/2015
 returning our key where our current unit fits.
 */

appServices.factory('Currentunitkey', function () {
    return {
        Currentunitkey: 0,
        SetUnitKey: function (key) {
            this.Currentunitkey = key;
        },
        GetUnitKey: function () {
            return parseInt(this.Currentunitkey);
        }
    }
});

// as yet unused.
appServices.factory('Nav', ['$resource', '$q', 'CurrentUnitId', 'CurrentCourseId', 'Menu', 'ClassMeta','CurrentSuperUnitId',
    function ($resource, $q, CurrentUnitId, CurrentCourseId, Menu, ClassMeta,CurrentSuperUnitId) {
        return {
            courseId: -1,
            unitId: -1,
            onNavigate: false,
            changed: 0,
            navData: null,
            navPages: null,
            setData: function (newData) {
                this.navData = newData;
            },
            getData: function (then, forceReload,doNotCalculate,customOptions) {
                customOptions = customOptions || {}
                var courseId = customOptions.courseId || CurrentCourseId.getCourseId()
                var superUnitId = customOptions.superUnitId || CurrentSuperUnitId.getId()
                if (this.courseId === courseId && this.superUnitId ==  superUnitId && !forceReload) {

                    /*
                     Golabs  21/01/2015
                     if this.navData was null them boom so put this check in
                     this caused issue on widnows not sure if on linux seems ok now.
                     */
                    if (this.navData !== null) {
                        if (this.navData.$resolved) {
                            setTimeout(function () {
                                then(this.navData)
                            }.bind(this), 0)
                        } else {
                            this.navData.$promise.then(then)
                        }
                        return this.navData
                    }
                }

                this.superUnitId = this.superUnitId && superUnitId;
                this.courseId = courseId;
                $q.all({
                    nav: Menu.query({
                        courseId: courseId,
                        superUnitId: superUnitId,
                        isCourseEditor: location.pathname == '/editor/'?true:undefined,
                        doNotCalculate:JSON.stringify(doNotCalculate)
                    }).$promise,
                    classMeta: ClassMeta.get({
                        classId: courseId
                    }).$promise
                }).then(
                    function (res) {
                        var nav = res.nav;
                        this.showNoMenuInstructions=false;
                        if(!customOptions.doNotStore){
                            if (angular.isDefined(nav.message)) {
                                console.log(nav.message);
                                this.navData = {
                                    error: nav.message
                                };
                                this.changed++;
                            } else {
                                this.navData = nav;
                                this.classMeta = res.classMeta;
                                then(this.navData);
                            }
                        }else{
                            then(nav);
                        }

                    }.bind(this),
                    function (error) {
                        this.navData = {
                            error: error.statusText
                        };
                        this.changed++;
                    }.bind(this)
                );

                return this.navData;
            },
            getPages: function (onlyHeaders) {
                var id = CurrentUnitId.getUnitId()
                if (id === this.unitId) {
                    return this.navPages
                }
                /*
                 Golabs 20/01/2015
                 needed to do a null test on navData.
                 */
                if (this.navData !== null) {
                    var unit = _.findWhere(this.navData.units, {
                        id: id
                    });
                    if (!unit) return false // could not find the unit
                } else {
                    return false
                }
                // no pages??
                if (unit.pages.length == 0) return false;
                // Resolve task status task dates to proper locale format
                for (var i = 0; i < unit.pages.length; i++) {
                    if (unit.pages[i].class_due_date) {
                        unit.pages[i].class_due_date = unit.pages[i].class_due_date.replace(new RegExp('-', 'g'), '/');
                    }
                }

                this.navPages = unit.pages;
                return this.navPages
            },
            getPage:function(id){
                return _.findWhere(this.navPages,{id:id});
            },
            getHeaders:function(){
                var id = CurrentUnitId.getUnitId()
                if (id === this.unitId && this.navHeaders) {
                    return this.navHeaders
                }
                if (this.navData !== null) {
                    var unit = _.findWhere(this.navData.units, {
                        id: id
                    });
                    if (!unit) return false // could not find the unit
                } else {
                    return false
                }
                if (unit.pages.length == 0) return false;
                this.navHeaders = _.filter(unit.pages,function(p){
                    return p.header_id == 0
                });
                return this.navHeaders
            }
        }
    }
]);

/*
 Golabs 26/01/2015
 returning our key where our current unit fits.
 */

appServices.factory('Currentpageid', ['History', 'Nav', 'CurrentUnitId', function (History, Nav, CurrentUnitId) {
    return {
        Currentpageid: 0,
        SetCurrentpageid: function (pageid) {
            this.Currentpageid = pageid;
        },
        GetCurrentpageid: function () {
            return parseInt(this.Currentpageid);
        },
        RecordingPageAccess: function (pageId) {
            if (window.onbeforeunload == null) {
                window.onbeforeunload = function () {
                    History.page_leaved({
                        page_id: pageId
                    });
                };
            }
            if (this.GetCurrentpageid() != pageId) {
                if (this.GetCurrentpageid() != 0) {
                    History.page_leaved({
                        page_id: this.GetCurrentpageid()
                    });
                }
                History.page_entered({
                    page_id: pageId
                });
                this.SetCurrentpageid(pageId);
                if (Nav.navData != null) {
                    var menuData = Nav.navData;
                    var unit = _.find(menuData.units, function (u) {
                        return u.id == CurrentUnitId.getUnitId()
                    });
                    if (angular.isDefined(unit)) {
                        var t = this;
                        var last_page = _.find(unit.pages, function (p) {
                            return p.id == String(t.GetCurrentpageid())
                        });
                        if (angular.isDefined(last_page)) {
                            last_page.isViewed = true;
                            Nav.setData(menuData);
                            Nav.changed++;
                        }

                    }

                }
            }
        }

    }
}]);
appServices.factory('Group', ['$resource', function ($resource) {
    return $resource('/api/group/:classid/', {
        classid: '@classid'
    }, {
        create: {
            url: '/api/group/:classid/',
            method: 'POST'
        },
        query: {
            url: '/api/group/:classid/',
            method: 'GET',
            isArray: true
        },
        remove: {
            url: '/api/group/:classid/:id',
            method: 'DELETE',
        },
        update: {
            url: '/api/group/:classid/:id',
            params:{id:'@id'},
            method: 'PUT',
        },
        setStartDate: {
            url: '/api/group/:classid/:id/start-date',
            params:{id:'@id'},
            method: 'POST',
        },

    });
}]);
appServices.factory('History', ['$resource', function ($resource) {
    return $resource('/history/', {}, {
        page_entered: {
            url: '/history/page-entered/',
            method: 'POST'
        },
        page_leaved: {
            url: '/history/page-leaved/',
            method: 'POST'
        },
        classHistoryForUser: {
            url: '/history/user-class-history/',
            method: 'POST'
        }
    });
}]);
appServices.factory('Languages', ['$resource',
    function ($resource) {
        return $resource('/languages/list', {}, {
            query: {
                method: 'GET'
            },
            translations: {
                method: 'GET',
                url: '/languages/translations/:languageId'
            },
            update: {
                method: 'POST',
                url: '/languages/update'
            }
        });
    }
]);

appServices.factory('Menu', ['$resource',
    function ($resource) {
        return $resource('/menu/:courseId', {}, {
            query: {
                method: 'GET'
            }
        });
    }
]);
appServices.factory('MenuV2', ['$resource',
    function ($resource) {
        return $resource('/api/classes/:courseId/menu', {}, {
            get: {
                method: 'GET'
            }
        });
    }
]);
appServices.factory('UploadFile', ['$resource',
    function ($resource) {
        return $resource('/upload/', {}, {
            imageData: {
                method: 'POST',
                url: '/upload/image-data/'
            }
        });
    }
]);

appServices.factory('Licenses', ['$resource',
    function ($resource) {
        return $resource('/api/licenses/:orgId/:userId', {}, {
            generate: {
                method: 'POST',
                url: '/api/licenses/generate/:orgId'
            },
            validate: {
                method: 'POST',
                url: '/api/licenses/validate'
            }
        });
    }
]);

appServices.factory('GraderNav', ['$resource','$http','GraderData',
    function ($resource,$http,GraderData) {
        var currentMode = '';
        var transformResponse = [$http.defaults.transformResponse[0],function(data,headers){

            !data.doNotUpdateUsers &&  data.students && GraderData.setStudents(data.students);
            return data;
        }]
        return $resource('/gradermenu/:courseId', {}, {
            query: {
                method: 'GET',
                transformResponse:transformResponse
            },
            archiveQuery: {
                method: 'GET',
                url: '/gradermenu/archive/:courseId',
                transformResponse:transformResponse
            },
            counter: {
                method: 'POST',
                url: '/gradermenu/counter/'
            },
            needingGradeForStudent:{
                url: '/api/gradermenu/:courseId/user/:userId',
                isArray:true
            },
            archiveGradeForStudent:{
                url: '/api/gradermenu/archive/:courseId/user/:userId',
                isArray:true
            }
        });
    }
]);

appServices.factory('Preference', ['$resource',
    function ($resource) {
        return $resource('/preference/:userId', {}, {
            query: {
                method: 'GET'
            }
        });
    }
]);

appServices.factory('User', ['$resource',
    function ($resource) {
        return $resource('/user/:userId', {}, {
            /*
             User information;
             response keys:
             @id (int)
             @fname (string)
             @lname (string)
             @email (string)
             @is_super_admin (boolean)
             @can_create_super_user (int, 0 or 1)
             @is_organization_admin (boolean)
             @can_add_admin_users (int, 0 or 1)
             @can_add_users (int, 0 or 1)
             @can_edit_courses (int, 0 or 1)
             @is_teacher (boolean)
             @is_edit_teacher (boolean)
             */
            query: {
                method: 'GET'
            },
            returnTO: {
                method: 'POST',
                url: '/user/return-to-my-account'
            }
        });
    }
]);

appServices.factory('Notification', ['$resource',
    function ($resource) {
        return $resource('/notifications/:notificationId', {notificationId:'@notificationId'}, {
            query: {
                method: 'GET',
                isArray: true
            },
            getNotificationGradePost: {
                method: 'POST',
                url: '/notifications/gradepost'
            },
            getStudentFeedback:{
                url: '/notifications/student-feedback/:notificationId'
            }
        });
    }
]);

appServices.factory('Chat', ['$resource',
    function ($resource) {
        return $resource('/chat/:courseId', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            getchat: {
                method: 'POST',
                url: '/chat/user'
            },
            send: {
                method: 'POST',
                url: '/chat/send'
            }
        });
    }
]);

appServices.factory('EditTerm', ['$resource',
    function ($resource) {
        return $resource('/editterm/:termId', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            save: {
                method: 'POST',
                url: '/editterm/save'
            },
            update: {
                method: 'POST',
                url: '/editterm/update'
            },
            delete: {
                method: 'POST',
                url: '/editterm/delete'
            },
            addclass: {
                method: 'POST',
                url: '/editterm/addclass'
            }

        });
    }
]);

//We are merging courses and classes.
//Url parameter must be departmentId
appServices.factory('CourseClass', ['$resource',
    function ($resource) {
        return $resource('/courseclass/:departmentId', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            terms: {
                method: 'POST',
                url: '/courseclass/terms'
            },
            teachers: {
                method: 'GET',
                url: '/courseclass/teachers'
            }

        });
    }
]);

appServices.factory('OrganizationUser', ['$resource',
    function ($resource) {
        return $resource('/organizationuser/:organizationId', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            getclassusers: {
                method: 'POST',
                url: '/organizationuser/classusers'
            }
        });
    }
]);

appServices.factory('Organization', ['$resource',
    function ($resource) {
        return $resource('/organization/:userId', {}, {
            query: {
                method: 'GET'
            }
        });
    }
]);


appServices.factory('CourseAdmin', ['$resource',
    function ($resource) {
        return $resource('/courseadmin/:departmentId', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

appServices.factory('Course', ['$resource',
    function ($resource) {
        return $resource('/course/:userId', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            // This will give a list of courses that the current user is a teacher for
            getTaught: {
                method: 'GET',
                url: '/course/taught'
            },
            asStudent: {
                method: 'GET',
                url: '/course/student',
                isArray: true
            }
        });
    }
]);

appServices.factory('GradesAssignments', ['$resource',
    function ($resource) {
        return $resource('/grades-assignments/', {}, {
            getAssignmentsForClass: {
                method: 'POST',
                url: '/grades-assignments/get-assignments-for-class',
            }
        });
    }
]);
appServices.factory('Utility', ['$resource',
    function ($resource) {
        return $resource('/utility/:userId', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

/*
 Golabs 28th of April 2015
 Modified Added quiz/save-video
 */
appServices.factory('Post', ['$resource','$q',
    function ($resource,$q) {
        var noCameraInterceptor = function(data){
            if(navigator.noCamAvailable){
                data.noCamera = true;
            }
            return angular.toJson(data);
        }
        return $resource('/post/:postId', {}, {
            query: {
                method: 'GET'
            },
            submit: {
                method: 'POST',
                url: '/post/save',
                transformRequest:noCameraInterceptor
            },
            templateHtml: {
                method: 'POST',
                url: '/post/templateHtml'
            },
            quizSubmit: {
                method: 'POST',
                url: '/quiz/save-video',
                transformRequest:noCameraInterceptor
            },
            saveVideo: {
                method: 'POST',
                url: '/post/save-video',
                transformRequest:noCameraInterceptor
            },
            delete: {
                method: 'POST',
                url: '/post/delete'
            },
            teacher_feedback: {
                method: 'POST',
                url: '/post/teacher_feedback'
            }
        });
    }
]);
appServices.factory('GraderQuiz', ['$resource','$http','GraderData',

    function ($resource,$http,GraderData) {
        var transformResponse = [$http.defaults.transformResponse[0],function(data,headers){
            data.students && GraderData.updateVisibleStudents(data.students);
            return data;
        }]
        return $resource('/graderquiz/:pageId', {'pageId':'@pageId'}, {
            query: {
                method: 'GET',
                transformResponse:transformResponse
            },
            update_score: {
                method: 'POST',
                url: '/graderquiz/update-score'
            },
            save: {
                method: 'POST',
                url: '/graderquiz/save-question'
            },
            allAttempts: {
                method: 'GET',
                url: '/api/pages/:pageId/attempts'
            },
            getAttempt:{
                method: 'GET',
                url: '/graderquiz/attempt'
            },
            deleteAttempt:{
                method:'POST',
                url: '/graderquiz/delete-attempt'
            },
            fixQuiz:{
                url: '/fix/quizzes/:pageId'
            },
            allNeedingGrade:{
                url: '/graderquiz/all-needing-grade'
            }
        });
    }
]);
appServices.factory('GraderPost', ['$resource','$http','GraderData',
    function ($resource,$http,GraderData) {
        var transformResponse = [$http.defaults.transformResponse[0],function(data,headers){
            data.students && GraderData.updateVisibleStudents(data.students);
            return data;
        }]
        return $resource('/graderpost/:postId', {}, {
            query: {
                method: 'GET',
                isArray:false,
                transformResponse:transformResponse
            },
            submit: {
                method: 'POST',
                url: '/graderpost/save'
            },
            delete: {
                method: 'POST',
                url: '/graderpost/delete'
            },
            all: {
                method: 'POST',
                url: '/graderpost/all',
                transformResponse:transformResponse
            },
            archive: {
                method: 'POST',
                url: '/graderpost/archive'
            },
            pageArchive: {
                method: 'POST',
                url: '/graderpost/pageArchive',
                transformResponse:transformResponse
            },
            grade: {
                method: 'POST',
                url: '/graderpost/grade'
            }
        });
    }
]);

appServices.factory('EditCourseClassUser', ['$resource',
    function ($resource) {
        return $resource('/editcourseclassuser/:classId/:userId', {}, {
            query: {
                method: 'GET'
            },
            submit: {
                method: 'POST',
                url: '/editcourseclassuser/save'
            },
            update: {
                method: 'POST',
                url: '/editcourseclassuser/update'
            },
            delete: {
                method: 'POST',
                url: '/editcourseclassuser/delete'
            },
            getavailableusers: {
                method: 'POST',
                url: '/editcourseclassuser/getavailableusers'
            },
            userinformation: {
                method: 'POST',
                url: '/editcourseclassuser/userinformation'
            },
            enroll_placement: {
                method: 'POST',
                url: '/editcourseclassuser/enrollplacement'
            }
        });
    }
]);
appServices.factory('UserInformation', function () {
    return {
        data: {}
    }
})

appServices.factory('EditCourseClass', ['$resource',
    function ($resource) {
        return $resource('/editcourseclass/:classId', {}, {
            query: {
                method: 'GET'
            },
            submit: {
                method: 'POST',
                url: '/editcourseclass/save'
            },
            update: {
                method: 'POST',
                url: '/editcourseclass/update'
            },
            quickupdate: {
                method: 'POST',
                url: '/editcourseclass/quickupdate'
            },
            delete: {
                method: 'POST',
                url: '/editcourseclass/delete'
            }
        });
    }
]);

/*
 DSerejo 2015-01-31
 Adding reset password controler.
 I'm adding a new method to EditOrganizationUser service
 */
appServices.factory('EditOrganizationUser', ['$resource',
    function ($resource) {
        return $resource('/editorganizationuser/:userId', {}, {
            /*
             Get user information
             response keys:
             @fname
             @lname
             @email
             @is_logged_in (int, 0 or 1)
             @preferred_language  this variable indicates user's preferred language(string, 2chars. ex: 'en')
             @is_super_admin (boolean)
             @can_add_super_admin (int, 0 or 1)
             @is_organization_admin (boolean)
             @can_add_organization_admin (int, 0 or 1)
             @can_add_user (int, 0 or 1)
             @can_edit_course (int, 0 or 1)
             */
            query: {
                method: 'GET'
            },
            /*
             Resetting user's password
             required:
             @email
             response:
             @message
             */
            resetpassword: {
                method: 'POST',
                url: '/editorganizationuser/resetpassword'
            },
            /*
             Add new organization user
             required:
             @fname
             @lname
             @email
             @password or @generate_password
             optional:
             @preferred_language (string, 2chars. ex: 'en')
             @is_super_admin (boolean)
             @can_add_super_admin (int, 0 or 1)
             @is_organization_admin (boolean)
             @can_add_organization_admin (int, 0 or 1)
             @can_add_user (int, 0 or 1)
             @can_edit_course (int, 0 or 1)
             */
            submit: {
                method: 'POST',
                url: '/editorganizationuser/save'
            },
            /*
             Update new organization user
             required:
             @fname
             @lname
             @email
             optional:
             @password or @generate_password
             @preferred_language (string, 2chars. ex: 'en')
             @is_super_admin (boolean)
             @can_add_super_admin (int, 0 or 1)
             @is_organization_admin (boolean)
             @can_add_organization_admin (int, 0 or 1)
             @can_add_user (int, 0 or 1)
             @can_edit_course (int, 0 or 1)
             */
            update: {
                method: 'POST',
                url: '/editorganizationuser/update'
            },
            /*
             TODO Implement delete user method
             Delete new organization user
             required:
             @email or @id
             */
            delete: {
                method: 'POST',
                url: '/editorganizationuser/delete'
            },
            userguardians: {
                method: 'POST',
                url: '/editorganizationuser/userguardians'
            },
            loginAs: {
                method: 'POST',
                url: '/editorganizationuser/login-as'
            },
            updateguardianuser: {
                method: 'POST',
                url: '/editorganizationuser/updateguardianuser'
            },
            disable: {
                method: 'POST',
                url: '/editorganizationuser/disable'
            }

        });
    }
]);

appServices.factory('EditEnrollment', ['$resource',
    function ($resource) {
        return $resource('/editenrollment/', {}, {
            /*
             Add new organization user
             required:
             @fname
             @lname
             @email
             @password or @generate_password
             optional:
             @preferred_language (string, 2chars. ex: 'en')
             @is_super_admin (boolean)
             @can_add_super_admin (int, 0 or 1)
             @is_organization_admin (boolean)
             @can_add_organization_admin (int, 0 or 1)
             @can_add_user (int, 0 or 1)
             @can_edit_course (int, 0 or 1)
             */
            submit: {
                method: 'POST',
                url: '/editenrollment/save'
            }

        });
    }
]);

appServices.factory('Signin', ['$resource',
    function ($resource) {
        return $resource('/signin/:userId', {}, {
            /*
             We need to know if user is using a temporary password
             response key:
             @tempPassword (boolean)
             */
            query: {
                method: 'get',
                url: '/signin/isTempPassword'
            },
            /*
             Changing temporary password
             required:
             @password
             response:
             @error (int)
             * error codes:
             * 0 - Success
             * 1 - User not logged in
             * 2 - Temporary password already changed
             * 3 - Invalid password
             * 4 - Unexpected
             */

            update: {
                method: 'POST',
                url: '/signin/update'
            },
            validate: {
                method: 'POST',
                url: '/signin/validateLicense'
            }
        });
    }
]);

appServices.factory('EditOrganization', ['$resource',
    function ($resource) {
        return $resource('/editorganization/:organizationId', {}, {
            query: {
                method: 'GET'
            },
            submit: {
                method: 'POST',
                url: '/editorganization/save'
            },
            update: {
                method: 'POST',
                url: '/editorganization/update'
            },
            delete: {
                method: 'POST',
                url: '/editorganization/delete'
            }
        });
    }
]);

appServices.factory('EditDepartment', ['$resource',
    function ($resource) {
        return $resource('/editdepartment/:departmentId', {}, {
            query: {
                method: 'GET'
            },
            submit: {
                method: 'POST',
                url: '/editdepartment/save'
            },
            update: {
                method: 'POST',
                url: '/editdepartment/update'
            },
            delete: {
                method: 'POST',
                url: '/editdepartment/delete'
            }
        });
    }
]);

appServices.factory('EditCourse', ['$resource',
    function ($resource) {
        return $resource('/editcourse/:courseId', {}, {
            query: {
                method: 'GET'
            },
            submit: {
                method: 'POST',
                url: '/editcourse/save'
            },
            update: {
                method: 'POST',
                url: '/editcourse/update'
            },
            delete: {
                method: 'POST',
                url: '/editcourse/delete'
            },
            languages: {
                method: 'GET',
                url: '/editcourse/languages'
            },
            getavailablecourses: {
                method: 'POST',
                url: '/editcourse/getavailablecourses'
            },
            clone: {
                method: 'POST',
                url: '/editcourse/clone'
            }
        });
    }
]);

appServices.factory('EditUnit', ['$resource',
    function ($resource) {
        return $resource('/editunit/:unitId', {}, {
            query: {
                method: 'GET'
            },
            all: {
                url: '/editunit/get',
                method: 'GET'
            },
            submit: {
                method: 'POST',
                url: '/editunit/save'
            },
            update: {
                method: 'POST',
                url: '/editunit/update'
            },
            delete: {
                method: 'POST',
                url: '/editunit/delete'
            },
            clone: {
                method: 'POST',
                url: '/editunit/clone'
            }
        });
    }
]);
appServices.factory('Session', ['$resource', '$http',
    function ($resource, $http) {
        var factory = {};

        factory.timeleft = function () {
            return $resource('/timeout').get().$promise
        };
        factory.restartTimeout = function () {
            return $http.get('/stoptimeout')
        };

        return factory;

    }
]);
appServices.factory('EditPage', ['$resource',
    function ($resource) {
        return $resource('/editpage/:pageId', {}, {
            query: {
                method: 'GET'
            },
            all: {
                method: 'GET',
                url: '/editpage/all'
            },
            submit: {
                method: 'POST',
                url: '/editpage/save'
            },
            update: {
                method: 'POST',
                url: '/editpage/update'
            },
            moveup: {
                method: 'POST',
                url: '/editpage/moveup'
            },
            movedown: {
                method: 'POST',
                url: '/editpage/movedown'
            },
            getsubunits: {
                method: 'POST',
                url: '/editpage/getsubunits'
            },
            del: {
                method: 'POST',
                url: '/editpage/remove'
            },
            clone: {
                method: 'POST',
                url: '/editpage/clone'
            }
        });
    }
]);

appServices.factory('ReadingPractice', ['$resource',
    function ($resource) {
        return $resource('/reading_practice/:pageId', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

appServices.factory('ListeningPractice', ['$resource',
    function ($resource) {
        return $resource('/listening_practice/:pageId', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

appServices.factory('LessonListening', ['$resource',
    function ($resource) {
        return $resource('/lesson_listening/:pageId', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

appServices.factory('NimbleknowledgeLesson', ['$resource',
    function ($resource) {
        return $resource('/nimbleknowledge_lesson/:pageId', {}, {
            post: {
                method: 'POST',
                url: '/nimbleknowledge_lesson'
            }
        });
    }
]);

appServices.factory('TimedReview', ['$resource',
    function ($resource) {
        return $resource('/timed_review/:contentId', {}, {
            query: {
                method: 'GET',
            }
        });
    }
]);

appServices.factory('Vocab', ['$resource',
    function ($resource) {
        return $resource('/vocab/:vocabId', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            all: {
                method: 'GET',
                url: '/vocab/all',
                isArray: true
            },
            byUnit: {
                method: 'GET',
                url: '/vocab/byunit',
                isArray: true
            },
            details: {
                method: 'POST',
                url: '/vocab/details',

            },
            save: {
                method: 'POST',
                url: '/vocab/save',
            }

        });
    }
]);

appServices.factory('Content', ['$resource',
    function ($resource) {
        return $resource('/content/:contentId', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

appServices.factory('TimedReviewContent', ['$resource',
    function ($resource) {
        return $resource('/content/:contentId/timed_review', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

appServices.factory('Quiz', ['$resource',
    function ($resource) {
        return $resource('/quiz/:quizId', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            submit: {
                method: 'POST',
                url: '/quiz/respond'
            },
            finalize: {
                method: 'POST',
                url: '/quiz/finalize'
            },
            start: {
                method: 'POST',
                url: '/quiz/start'
            },
            retake: {
                method: 'POST',
                url: '/quiz/retake'
            },
            storescore: {
                method: 'POST',
                url: '/quiz/storescore'
            },
            details:{
                method: 'POST',
                url: '/service.testbank.test/details/:quizId',
                params:{'quizId':'@quizId'}
            }

        });
    }
]);
appServices.factory('QuizData', function () {
    return {
        id: 0,
        setId: function (id) {
            this.id = id;
        },
        getId: function () {
            return this.id;
        }
    }
});
appServices.factory('QuizList', ['$resource',
    function ($resource) {
        return $resource('/quizlist/:quizId', {}, {
            list: {
                method: 'POST',
                url: '/quizlist/list'
            },
            already_taken: {
                method: 'POST',
                url: '/quizlist/already-taken'
            }
        });
    }
]);

appServices.factory('ExternalLink', ['$resource',
    function ($resource) {
        return $resource('/externallink/:externalLinkId', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
    }
]);

appServices.factory('SeeIT', ['$resource',
    function ($resource) {
        return $resource('/seeit/:vocabID', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            update: {
                method: 'POST'
            }
        });
    }
]);

appServices.factory('FlashIT', ['$resource',
    function ($resource) {
        return $resource('/flashit/:vocabID', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            update: {
                method: 'POST'
            }
        });
    }
]);

appServices.factory('FlashITAudio', ['$resource',
    function ($resource) {
        return $resource('/flashitaudio/:vocabID', {}, {
            query: {
                method: 'GET',
                isArray: true
            },
            update: {
                method: 'POST'
            }
        });
    }
]);

/*
 Golabs 25/01/0215
 Set to service Cookiecutter to get our cookies needed
 We may need rootScope so left in.
 */
appServices.factory('Cookiecutter', ['$rootScope',
    function ($rootScope) {
        return {
            url: '',
            /*
             Golabs 25/01/2015
             We are sending our current url for string processing
             using some simple regex.
             */
            seturltostring: function (url) {
                //We will on do this for grader all the rest we will return '';
                //This is so grader is distinguishable.
                if (url.match(/\/grader\//i)) {
                    this.url = url.replace(/^htt\w+|\d+/gi, '');
                    this.url = this.url.replace(/\W+/gi, '_');
                } else {
                    this.url = '';
                }
            },
            /*
             Golabs 23/01/0215
             simple global get our target cookie script
             cookies are set in services for unit_id and course_id
             */
            getCookiebyname: function (tmpname, ignore_url) {
                this.seturltostring(document.URL); //need to send our current url

                var cname = tmpname;
                var name = cname + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1);
                    if (c.indexOf(name) == 0)
                        return c.substring(name.length, c.length);
                }
                return 0;
            },
            /*
             Golabs 23/01/2015
             We will be returning our course id
             Based on our cookie informaiton we have on our current course_id
             if we have no cookie we will return the first course id which is scope_course_id
             */
            returncourseid: function (courses) {
                var course_id = this.getCookiebyname('course_id', true);
                if (course_id === 0) return courses[0].id
                for (var i = 0; i < courses.length; i++) {
                    if (courses[i].id == course_id) {
                        return courses[i].id
                    }
                }
                this.setcookie('course_id', courses[0].id)
                return courses[0].id
            },
            /*
             Golabs 23/01/2015
             we Are using a library from underscore-min.js:
             Which is just search of the units array for the corresponding
             courseid or id this will return the single unit object so we can
             pull out the name from our target unit.
             */
            returncourename: function (CourseId, units) {
                var unit = _.findWhere(units, {
                    id: CourseId
                });
                return unit.name
            },
            /*
             DSerejo 2015-02-04
             */
            returnclassid: function (classes) {
                var class_id = this.getCookiebyname('class_id');
                if (class_id === 0) return classes[0].id;
                for (var i = 0; i < classes.length; i++) {
                    if (classes[i].id == course_id) {
                        return courses[i].id
                    }
                }

                this.setcookie('course_id', classes[0].id);
                return classes[0].id
            },
            returnclassname: function (ClassId, units) {
                var unit = _.findWhere(units, {
                    id: ClassId
                });
                return unit.name
            },
            returnorganizationid: function (organizations) {
                var organization_id = this.getCookiebyname('organization_id');
                if (organization_id === 0) return organizations[0].id
                for (var i = 0; i < organizations.length; i++) {
                    if (organizations[i].id == organization_id) {
                        return organizations[i].id
                    }
                }
                this.setcookie('course_id', organizations[0].id)
                return organizations[0].id
            },
            returndepartmentid: function (departments) {
                var department_id = this.getCookiebyname('department_id');
                if (department_id === 0) return departments[0].id
                for (var i = 0; i < departments.length; i++) {
                    if (departments[i].id == department_id) {
                        return departments[i].id
                    }
                }
                this.setcookie('department_id', departments[0].id)
                return departments[0].id
            },
            returntermid: function (terms) {
                var term_id = this.getCookiebyname('term_id');
                if (term_id === 0) return terms[0].id
                for (var i = 0; i < terms.length; i++) {
                    if (terms[i].id == term_id) {
                        return terms[i].id
                    }
                }
                this.setcookie('term_id', terms[0].id)
                return terms[0].id
            },
            /*
             Golabs 25/01/2015
             Here we will bake our cookies as needed.
             */
            isInvalidPage: function(){
                return this.url && this.url.indexOf('/public/')>=0
            },
            setcookie: function (name, value) {
                if(this.isInvalidPage()) return;
                var d = new Date();
                d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
                document.cookie = name + "=" + value + "; " + "expires=" + d.toUTCString() + '; path=/';
            },
            delete_cookie:function ( name ) {
                if( this.getCookiebyname( name ) ) {
                    document.cookie = this.url + '_' + name + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
                }
            }

        };
    }
]);




// TODO: Make this not global
// A global mapping of date formats to locale
var _global_localized_date_formats = {
    "ar-SA": "dd/MM/yy",
    "bg-BG": "dd.M.yy",
    "ca-ES": "dd/MM/yy",
    "zh-TW": "yy/M/d",
    "cs-CZ": "d.M.yy",
    "da-DK": "dd-MM-yy",
    "de-DE": "dd.MM.yy",
    "el-GR": "d/M/yy",
    "en-US": "M/d/yy",
    "fi-FI": "d.M.yy",
    "fr-FR": "dd/MM/yy",
    "he-IL": "dd/MM/yy",
    "hu-HU": "yy. MM. dd.",
    "is-IS": "d.M.yy",
    "it-IT": "dd/MM/yy",
    "ja-JP": "yy/MM/dd",
    "ko-KR": "yy-MM-dd",
    "nl-NL": "d-M-yy",
    "nb-NO": "dd.MM.yy",
    "pl-PL": "yy-MM-dd",
    "pt-BR": "d/M/yy",
    "ro-RO": "dd.MM.yy",
    "ru-RU": "dd.MM.yy",
    "hr-HR": "d.M.yy",
    "sk-SK": "d. M. yy",
    "sq-AL": "yy-MM-dd",
    "sv-SE": "yy-MM-dd",
    "th-TH": "d/M/yy",
    "tr-TR": "dd.MM.yy",
    "ur-PK": "dd/MM/yy",
    "id-ID": "dd/MM/yy",
    "uk-UA": "dd.MM.yy",
    "be-BY": "dd.MM.yy",
    "sl-SI": "d.M.yy",
    "et-EE": "d.MM.yy",
    "lv-LV": "yy.MM.dd.",
    "lt-LT": "yy.MM.dd",
    "fa-IR": "MM/dd/yy",
    "vi-VN": "dd/MM/yy",
    "hy-AM": "dd.MM.yy",
    "az-Latn-AZ": "dd.MM.yy",
    "eu-ES": "yy/MM/dd",
    "mk-MK": "dd.MM.yy",
    "af-ZA": "yy/MM/dd",
    "ka-GE": "dd.MM.yy",
    "fo-FO": "dd-MM-yy",
    "hi-IN": "dd-MM-yy",
    "ms-MY": "dd/MM/yy",
    "kk-KZ": "dd.MM.yy",
    "ky-KG": "dd.MM.yy",
    "sw-KE": "M/d/yy",
    "uz-Latn-UZ": "dd/MM yy",
    "tt-RU": "dd.MM.yy",
    "pa-IN": "dd-MM-yy",
    "gu-IN": "dd-MM-yy",
    "ta-IN": "dd-MM-yy",
    "te-IN": "dd-MM-yy",
    "kn-IN": "dd-MM-yy",
    "mr-IN": "dd-MM-yy",
    "sa-IN": "dd-MM-yy",
    "mn-MN": "yy.MM.dd",
    "gl-ES": "dd/MM/yy",
    "kok-IN": "dd-MM-yy",
    "syr-SY": "dd/MM/yy",
    "dv-MV": "dd/MM/yy",
    "ar-IQ": "dd/MM/yy",
    "zh-CN": "yy/M/d",
    "de-CH": "dd.MM.yy",
    "en-GB": "dd/MM/yy",
    "es-MX": "dd/MM/yy",
    "fr-BE": "d/MM/yy",
    "it-CH": "dd.MM.yy",
    "nl-BE": "d/MM/yy",
    "nn-NO": "dd.MM.yy",
    "pt-PT": "dd-MM-yy",
    "sr-Latn-CS": "d.M.yy",
    "sv-FI": "d.M.yy",
    "az-Cyrl-AZ": "dd.MM.yy",
    "ms-BN": "dd/MM/yy",
    "uz-Cyrl-UZ": "dd.MM.yy",
    "ar-EG": "dd/MM/yy",
    "zh-HK": "d/M/yy",
    "de-AT": "dd.MM.yy",
    "en-AU": "d/MM/yy",
    "es-ES": "dd/MM/yy",
    "fr-CA": "yy-MM-dd",
    "sr-Cyrl-CS": "d.M.yy",
    "ar-LY": "dd/MM/yy",
    "zh-SG": "d/M/yy",
    "de-LU": "dd.MM.yy",
    "en-CA": "dd/MM/yy",
    "es-GT": "dd/MM/yy",
    "fr-CH": "dd.MM.yy",
    "ar-DZ": "dd-MM-yy",
    "zh-MO": "d/M/yy",
    "de-LI": "dd.MM.yy",
    "en-NZ": "d/MM/yy",
    "es-CR": "dd/MM/yy",
    "fr-LU": "dd/MM/yy",
    "ar-MA": "dd-MM-yy",
    "en-IE": "dd/MM/yy",
    "es-PA": "MM/dd/yy",
    "fr-MC": "dd/MM/yy",
    "ar-TN": "dd-MM-yy",
    "en-ZA": "yy/MM/dd",
    "es-DO": "dd/MM/yy",
    "ar-OM": "dd/MM/yy",
    "en-JM": "dd/MM/yy",
    "es-VE": "dd/MM/yy",
    "ar-YE": "dd/MM/yy",
    "en-029": "MM/dd/yy",
    "es-CO": "dd/MM/yy",
    "ar-SY": "dd/MM/yy",
    "en-BZ": "dd/MM/yy",
    "es-PE": "dd/MM/yy",
    "ar-JO": "dd/MM/yy",
    "en-TT": "dd/MM/yy",
    "es-AR": "dd/MM/yy",
    "ar-LB": "dd/MM/yy",
    "en-ZW": "M/d/yy",
    "es-EC": "dd/MM/yy",
    "ar-KW": "dd/MM/yy",
    "en-PH": "M/d/yy",
    "es-CL": "dd-MM-yy",
    "ar-AE": "dd/MM/yy",
    "es-UY": "dd/MM/yy",
    "ar-BH": "dd/MM/yy",
    "es-PY": "dd/MM/yy",
    "ar-QA": "dd/MM/yy",
    "es-BO": "dd/MM/yy",
    "es-SV": "dd/MM/yy",
    "es-HN": "dd/MM/yy",
    "es-NI": "dd/MM/yy",
    "es-PR": "dd/MM/yy",
    "am-ET": "d/M/yy",
    "tzm-Latn-DZ": "dd-MM-yy",
    "iu-Latn-CA": "d/MM/yy",
    "sma-NO": "dd.MM.yy",
    "mn-Mong-CN": "yy/M/d",
    "gd-GB": "dd/MM/yy",
    "en-MY": "d/M/yy",
    "prs-AF": "dd/MM/yy",
    "bn-BD": "dd-MM-yy",
    "wo-SN": "dd/MM/yy",
    "rw-RW": "M/d/yy",
    "qut-GT": "dd/MM/yy",
    "sah-RU": "MM.dd.yy",
    "gsw-FR": "dd/MM/yy",
    "co-FR": "dd/MM/yy",
    "oc-FR": "dd/MM/yy",
    "mi-NZ": "dd/MM/yy",
    "ga-IE": "dd/MM/yy",
    "se-SE": "yy-MM-dd",
    "br-FR": "dd/MM/yy",
    "smn-FI": "d.M.yy",
    "moh-CA": "M/d/yy",
    "arn-CL": "dd-MM-yy",
    "ii-CN": "yy/M/d",
    "dsb-DE": "d. M. yy",
    "ig-NG": "d/M/yy",
    "kl-GL": "dd-MM-yy",
    "lb-LU": "dd/MM/yy",
    "ba-RU": "dd.MM.yy",
    "nso-ZA": "yy/MM/dd",
    "quz-BO": "dd/MM/yy",
    "yo-NG": "d/M/yy",
    "ha-Latn-NG": "d/M/yy",
    "fil-PH": "M/d/yy",
    "ps-AF": "dd/MM/yy",
    "fy-NL": "d-M-yy",
    "ne-NP": "M/d/yy",
    "se-NO": "dd.MM.yy",
    "iu-Cans-CA": "d/M/yy",
    "sr-Latn-RS": "d.M.yy",
    "si-LK": "yy-MM-dd",
    "sr-Cyrl-RS": "d.M.yy",
    "lo-LA": "dd/MM/yy",
    "km-KH": "yy-MM-dd",
    "cy-GB": "dd/MM/yy",
    "bo-CN": "yy/M/d",
    "sms-FI": "d.M.yy",
    "as-IN": "dd-MM-yy",
    "ml-IN": "dd-MM-yy",
    "en-IN": "dd-MM-yy",
    "or-IN": "dd-MM-yy",
    "bn-IN": "dd-MM-yy",
    "tk-TM": "dd.MM.yy",
    "bs-Latn-BA": "d.M.yy",
    "mt-MT": "dd/MM/yy",
    "sr-Cyrl-ME": "d.M.yy",
    "se-FI": "d.M.yy",
    "zu-ZA": "yy/MM/dd",
    "xh-ZA": "yy/MM/dd",
    "tn-ZA": "yy/MM/dd",
    "hsb-DE": "d. M. yy",
    "bs-Cyrl-BA": "d.M.yy",
    "tg-Cyrl-TJ": "dd.MM.yy",
    "sr-Latn-BA": "d.M.yy",
    "smj-NO": "dd.MM.yy",
    "rm-CH": "dd/MM/yy",
    "smj-SE": "yy-MM-dd",
    "quz-EC": "dd/MM/yy",
    "quz-PE": "dd/MM/yy",
    "hr-BA": "d.M.yy.",
    "sr-Latn-ME": "d.M.yy",
    "sma-SE": "yy-MM-dd",
    "en-SG": "d/M/yy",
    "ug-CN": "yy-M-d",
    "sr-Cyrl-BA": "d.M.yy",
    "es-US": "M/d/yy"
};

appServices.factory('$fileupload', function () {
    return {
        progress: 0,
        content: {}
    };
});

/*
 Golabs Mathsjax service convert to math jax format
 taking the qustion and looing at prompt and options
 and setting up for mathjax formular if mathjax class is present.
 */
appServices.factory('mathJaxConvert', function() {
    return {
        parseQuestion: function(question) {
            if (typeof question.prompt === 'undefined' || question.prompt == null) {
                return question
            }
            if ((question.prompt.match(/class="math-tex"/)) && (question.prompt.match(/\\\(/))) {
                question.contentPlusMathjac = this.mathJaxhtml(question.prompt.replace(/\r\n|\n|\r/g, ''),'p');
            }

            //testing options.
            if (typeof question.options === 'object') {
                var mathjax = false;
                for (var i = 0; i < question.options.length;i++){
                    if ((typeof question.options[i] === 'string') &&
                        (question.options[i].match(/class="math-tex"/))) {
                        mathjax = true;
                        question.optionsMathJax = [];
                    }
                }
                for (var i = 0; i < question.options.length;i++){
                    if (mathjax){
                        if ((typeof question.options[i] === 'string') &&
                            (question.options[i].match(/class="math-tex"/))) {
                            if (typeof question.optionsMathJax === 'undefined' ){

                            }
                            question.optionsMathJax[i] = this.mathJaxhtml(question.options[i].replace(/\r\n|\n|\r/g, ''),'o');

                        }
                        else{
                            if ((typeof question.optionsMathJax !== 'undefined') && (typeof i === 'number') && (typeof question.options !== 'undefined')){
                                question.optionsMathJax[i] = [];
                                question.optionsMathJax[i][0] = {};
                                question.optionsMathJax[i][0].html = question.options[i].replace(/<p>|<\/p>/gi,'');
                            }
                        }
                    }
                }
            }

            return question;
        },
        mathJaxhtml: function(test,type) {
            var tmp = {},
                contentPlusMathjac = [];
            test = test.replace(/&nbsp;/, ' ');
            test = test.replace(/\r?\n|\r/,'');
            while (test.match(/<span class="math-tex">.*?\)<\/span>/)) {
                var a = test.match(/(.*?)<span class="math-tex">(.*?\))<\/span>/);
                if (typeof a[2] !== 'undefined') {
                    a[2] = a[2].replace(/\\\(|\\\)/g, '');
                    if (type=== 'o'){
                        a[2] = a[2].replace(/\(|\)/g, '');
                    }
                    a[2] = this.htmlDecode(a[2]);
                    if (type === 'o'){
                        if ((a[1] === '<p>') ||
                            (a[1] === '<p>') ||
                            (!a[1].match(/\w/))){
                            a[1] = '';
                        }
                        a[2] = a[2].replace(/greater than/gi,'>');
                        a[2] = a[2].replace(/Less than/gi,'<');
                    }
                    tmp.html = a[1].replace(/<p/gi,'<span');
                    tmp.html = tmp.html.replace(/<\/p/gi,'</span');
                    tmp.maths = a[2];
                    contentPlusMathjac.push(tmp);
                    tmp = {};
                }
                test = test.replace(/.*?<span class="math-tex">.*?\)<\/span>/, '');
            }
            tmp = {}
            tmp.html = test;
            contentPlusMathjac.push(tmp);
            return contentPlusMathjac;
        },
        htmlDecode: function(input){
            var e = document.createElement('div');
            e.innerHTML = input;
            return e.childNodes[0].nodeValue;
        }
    }
});
appServices.factory('nav',
    ['utils','$http',
        function(utils,$http) {
            return {

                courses: null,
                selected_course: null,
                loadBanks: function(then){
                    if(this.allBanks){
                        if (then){
                            then();
                        }
                        return;
                    }

                    var that = this;
                    if(!this.loading)
                        this.loading = $http.get('/service.testbank.bank/get-by-org/0')
                    this.loading.then(function(response){
                        that.allBanks = response.data.banks;
                        if(then){
                            then();
                            delete that.loading
                        }
                    })
                },
                setSelectedCourse: function(course) {
                    this.selected_course = course;
                },
                setSelectedCourseId: function(id) {
                    var c = utils.findById(this.courses, id);
                    if (c)
                        this.selected_course = c;
                },

                getCourseId: function() {
                    return this.selected_course.id;
                },
                getCourseName: function() {
                    return this.selected_course.name;
                },



                // future use

                org_id: 0,
                org_name: '',

                dept_id: 0,
                dept_name: '',

                unit_id: 0,
                unit_name: '',

                setOrganizationId: function(id) {
                    this.org_id = id;
                },
                getOrganizationId: function() {
                    return this.org_id;
                },
                setOrganizationName: function(name) {
                    this.org_name = name;
                },
                getOrganizationName: function() {
                    return this.org_name;
                },

                setDepartmentId: function(id) {
                    this.dept_id = id;
                },
                getDepartmentId: function() {
                    return this.dept_id;
                },
                setDepartmentName: function(name) {
                    this.dept_name = name;
                },
                getDepartmentName: function() {
                    return this.dept_name;
                },

            };
        }]
).factory('modifiedMatching', function() {
        return {
            clearlastCordinates: function($scope, coords, question) {
                var recordedEvents = new Array();
                for (var i = 0; i < $scope.recordedEvents.length; i++) {
                    if (i !== coords) {
                        recordedEvents.push($scope.recordedEvents[i]);
                    }
                }
                $scope.recordedEvents = recordedEvents;
                //this.Selectedquestions[question.id] = question;
                this.createModifyelements($scope);
            },
            clearelements: function($scope) {
                //Removing Existing Elements
                var sizelength = document.getElementsByClassName("CreatedElement").length;
                for (var i = 0; i < sizelength; i++) {
                    document.getElementsByClassName("imgCrop_wrap")[0].removeChild(document.getElementsByClassName("CreatedElement")[0]);
                }
            },
            createModifyelements: function($scope) {
                this.clearelements($scope);
                //Creating our preview elements
                for (var i = 0; i < $scope.recordedEvents.length; i++) {
                    var el2 = document.createElement("div")
                    el2.style.display = "block";
                    el2.style.width = $scope.recordedEvents[i].matchedImagewidth + 'px';
                    el2.style.height = $scope.recordedEvents[i].matchedImageheight + 'px';
                    el2.style.position = "absolute";

                    el2.style.top = $scope.recordedEvents[i].y1 + 'px';
                    el2.style.left = $scope.recordedEvents[i].x1 + 'px';
                    el2.style.textAlign = "center";
                    switch ($scope.matchedImage.selectedtick) {
                        case 'blank':
                            el2.style.backgroundColor = "white";
                            el2.style.border = "thin solid #000000";
                            break;
                        case 'transparentw':
                            el2.style.backgroundColor = "white";
                            el2.style.border = "thin solid #000000";
                            el2.style.opacity = .5;
                            break;
                        case 'transparentb':
                            el2.style.backgroundColor = "black";
                            el2.style.border = "thin solid #000000";
                            el2.style.opacity = .5;
                            break;
                        case 'starb':
                        case 'starg':
                        case 'starr':
                            var icon = 'asterisk';
                            break;
                        case 'dropb':
                        case 'dropg':
                        case 'dropr':
                            var icon = 'tint';
                            break;
                        case 'dropb':
                        case 'dropg':
                        case 'dropr':
                            var icon = 'tint';
                            break;
                        case 'pushpinb':
                        case 'pushping':
                        case 'pushpinr':
                            var icon = 'pushpin';
                            break;
                        case 'targetb':
                        case 'targetg':
                        case 'targetr':
                            var icon = 'screenshot';
                            break;
                        default:
                            el2.style.backgroundColor = "white";
                            el2.style.border = "thin solid #000000";
                    }

                    switch ($scope.matchedImage.selectedtick) {
                        case 'starb':
                        case 'dropb':
                        case 'pushpinb':
                        case 'targetb':
                            var color = 'blue';
                            break;
                        case 'starg':
                        case 'dropg':
                        case 'pushping':
                        case 'targetg':
                            var color = 'green';
                            break;
                        case 'starr':
                        case 'dropr':
                        case 'pushpinr':
                        case 'targetr':
                            var color = 'red';
                            break;
                    }

                    if (typeof icon === 'string') {
                        el2.innerHTML = '<span class="glyphicon glyphicon-' + icon + '" aria-hidden="true" style="color: ' + color + ';font-size: xx-large;margin-left: 10px;margin-top:' + $scope.recordedEvents[i].matchedImageheight / 2 + 'px"></span>';
                    }

                    el2.class = "createdelement";
                    var att = document.createAttribute("class"); // Create a "class" attribute
                    att.value = "CreatedElement";
                    el2.setAttributeNode(att);
                    document.getElementsByClassName("imgCrop_wrap")[0].appendChild(el2);
                }
            },
            setCordinates: function($scope) {

                var tmp = {};
                var a = new Array('matchedImagewidth', 'matchedImageheight', 'x1', 'x2', 'y1', 'y2');
                for (var i = 0; i < a.length; i++) {
                    tmp[a[i]] = parseFloat(angular.element('#' + a[i])[0].value);
                }
                if (tmp.matchedImagewidth === 0) return 'error';
                else if (tmp.matchedImageheight === 0) return 'error';
                tmp.textvalue = '';
                tmp.show = 'img';
                tmp.value = 0;
                if (typeof $scope.question === "object") {
                    if (angular.isDefined($scope.question.imgdata.matching.matchedImage.savedname)) {
                        tmp.img = $scope.question.imgdata.matching.matchedImage.savedname;
                    }
                }
                $scope.recordedEvents.push(tmp);
                this.createModifyelements($scope);
            }

        }
    })
    .factory('multipartAnswerFormat', function() {
        /*
         Golabs puting back our answer into multi format if edited.
         */
        return {
            checknow: function(test) {
                test = test.replace(/\{\d+\:\w+\:.*?}/, function(match, capture) {
                    var answer = match.replace(/<\w+>|<\/\w+>/g, ''),
                        htmls = ['img', 'font', 'a', 'span'],
                        htmlRegex1;
                    for (var i = 0; i < htmls.length; i++) {
                        htmlRegex1 = new RegExp("<" + htmls + ".*?>", "g");
                        answer = answer.replace(htmlRegex1, '');
                    }
                    answer = answer.replace(/\~\?/g, '~');
                    answer = answer.replace(/\=\?/g, '=');
                    answer = answer.replace(/\s+\~\s+|\s+\~|\~\s+/g, '~');
                    answer = answer.replace(/\s+\~\=\s+|\s+\~\=|\~\=\s+/g, '~=');
                    return '__' + answer + '__';
                });
                test = test.replace(/____{/g, '__{');
                test = test.replace(/}____/g, '}__');
                return test;

            }
        };
    })

    .factory('IllegalQuestion', function() {
        /*
         Golabs puting back our answer into multi format if edited.
         */
        return {
            checknow: function(question) {
                var content = ['prompt', 'extra'];
                if (typeof question.options === "object") {
                    for (var key in question.options) {
                        if (typeof question.options[key] === "String") {
                            content.push(question.options[key]);
                        }
                    }
                }
                for (var i = 0; i < content.length; i++) {
                    if (typeof question[content[i]] === "string") {
                        if (question[content[i]].match(/ng-\w+=|<script|class="ng-scope"/i)) {
                            alert('Illegal Content in Question can not be saved')
                            return true;
                        }
                    }
                }
                return false;
            }
        };
    })
    .factory('SelectedQuestions', function() {
        return {
            Selectedquestions: {},
            set: function(question) {
                this.Selectedquestions[question.id] = question;
            },
            remove: function(question) {
                delete this.Selectedquestions[question.id];
            },
            reset: function() {
                this.Selectedquestions = {}
            },
            get: function() {
                return this.Selectedquestions;
            }
        }
    })

appServices.factory('ReEncodeHtml', function () {
    return {
        restoreHTML: function (h) {
            if(typeof h === 'object') return h;
            if (h === null) return null
            var d = document.createElement("div");
            d.innerHTML =  h.
                replace(/>/g, "&gt;").
                replace(/</g, "&lt;").
                replace(/"/g, "&quot;");
            //solving firefox issue
            var text = d.innerText || d.textContent;
            return text.replace(/u2019/ig,"'");
        },

        provisionHTML: function(h){
            var d = document.createElement("div");
            d.innerText =  h
            return  d.innerHTML.replace(/'/g,"u2019").
                replace(/>/g, "&gt;").
                replace(/</g, "&lt;").
                replace(/"/g, "&quot;");
        },

        rawCorrection:function(raw){
            return raw.replace(/style="(.*?)"/g,'style=&quot;$1&quot;').
                replace(/img="(.*?)"/g,'img=&quot;$1&quot;').
                replace(/class="(.*?)"/g,'class=&quot;$1&quot;').
                replace(/value="(.*?)"/g,'value=&quot;$1&quot;').
                replace(/name="(.*?)"/g,'name=&quot;$1&quot;').
                replace(/id="(.*?)"/g,'id=&quot;$1&quot;').
                replace(/title="(.*?)"/g,'title=&quot;$1&quot;').
                replace(/text="(.*?)"/g,'text=&quot;$1&quot;').
                replace(/href="(.*?)"/g,'href=&quot;$1&quot;');
        }

    }
});

/*
 Golabs adding in the ability to do a range ie..
 <div ng-repeat="n in [] | range:100">
 do something
 </div>
 */
appServices.filter('range', function() {
    return function(input, total) {
        total = parseInt(total);
        for (var i=0; i<total; i++)
            input.push(i);
        return input;
    };
});

/********************************grader.js end*************************************/


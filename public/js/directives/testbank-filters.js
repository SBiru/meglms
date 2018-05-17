
try {
    var app = angular.module('app.testbank');
} catch (err) {
    var app = angular.module('app');
}

app
    .directive('testbankFilters',
    [   'Organization',
        'OrganizationV2',
        'Department',
        'Class',
        'Alerts',
        'UserV2',
        function(Organization,OrganizationV2,Department,Class,Alerts,UserV2) {
            return {
                restrict: 'E',
                require: 'ngModel',
                templateUrl: '/public/views/directives/testbankFilters.html',
                scope:{
                    hideViewBtn:'=?',
                    onChange:'=?'
                },
                link: function(scope,element,attrs,ctrl){
                    //private variables
                    var me;
                    var hierarchy = ['org','dept','class','user'];
                    //public variables
                    scope.allowedFilters = [
                        {
                            id:'class',
                            name:'Class'
                        },
                        {
                            id:'user',
                            name:'User'
                        },

                    ];

                    scope.selected = {};
                    scope.filters={};

                    //public functions
                    scope.reloadOrg = reloadOrg;
                    scope.reloadDepartments = reloadDepartments;
                    scope.reloadClasses = reloadClasses;
                    scope.reloadUsers = reloadUsers;
                    scope.canFinish = canFinish;
                    scope.setModel = setModel;


                    //private functions

                    scope.$watch('[selected.orgId,filters.org]',orgChanged,true);
                    scope.$watch('[selected.deptId,filters.dept]',deptChanged,true);
                    scope.$watch('[selected.classId,filters.class]',classChanged,true);
                    scope.$watch('selected',somethingHasChanged,true);
                    scope.$root.$watch('user',main);

                    function somethingHasChanged(selected){
                        if(!selected || !scope.hideViewBtn || !prepareFilter()) return;
                        setModel();
                    }

                    //main
                    function main(user){
                        if(!user) return;
                        me = user;
                        getAllowedFilters();
                    }


                    //functions

                    function getAllowedFilters(){
                        if(scope.allowedFiltersSet)
                            return;
                        if(me.is_super_admin){
                            scope.allowedFilters.unshift(
                                {
                                    id:'org',
                                    name:'Organization'
                                },{
                                    id:'dept',
                                    name:'Department'
                                }
                            );
                        }else if(me.is_organization_admin)
                            scope.allowedFilters.unshift({
                                id:'dept',
                                name:'Department'
                            });
                        scope.allowedFiltersSet = true;
                    }

                    function reloadOrg(){
                        if(!scope.filters.org){
                            return;
                        }
                        Organization.get({
                            userId: 'me'
                        }, function(organizations) {
                            scope.organizations = organizations.organizations;
                            if (angular.isDefined(me)) {
                                scope.selected.orgId = me.org_id;
                            }
                        });
                    }
                    function reloadDepartments(){
                        if(!scope.filters.dept){
                            return;
                        }
                        var promise;
                        if(scope.filters.org && scope.allowedFilters[0].id=='org' || scope.allowedFilters[0].id=='dept'){
                            var params = {
                                orgId:scope.selected.orgId || 'me'
                            };
                            promise = Department.getOrgDepartments(params).$promise;
                        }
                        else{
                            promise = Department.query(params).$promise;
                        }

                        promise.then(function(depts){
                            scope.departments = depts;
                        },function(error){
                            scope.error = error.error;
                        })
                    }

                    function reloadClasses(){
                        if(!scope.filters.class){
                            return;
                        }
                        var params = {
                            orgId:scope.selected.orgId,
                            deptId:scope.selected.deptId,
                            as:'edit_teacher'
                        }
                        Class.query(params,function(classes){
                            scope.classes = classes;

                        },function(error){
                                scope.error = error.error;
                            }
                        )
                    }
                    function reloadUsers(){
                        if(!scope.filters.user){
                            return;
                        }
                        var params = {
                            orgId:scope.selected.orgId,
                            deptId:scope.selected.deptId,
                            classId:scope.selected.classId,
                            role:'edit_teacher'
                        }
                        UserV2.getUsers(params,function(users){
                                for(var i in users){
                                    users[i].name = users[i].lastName +', ' + users[i].firstName
                                }
                                scope.users = _.sortBy(users,'name');
                                if(_.findWhere(scope.users,{id:me.id}))
                                    scope.users.unshift({
                                        id:me.id,
                                        name:"Me"
                                    })

                            },function(error){
                                scope.error = error.error;
                            }
                        );

                    }

                    function orgChanged(newValue){
                        if(!newValue[1]) {
                            delete scope.selected.orgId
                            return;
                        }
                        reloadClasses();
                        reloadDepartments();
                        reloadUsers();
                    }
                    function deptChanged(newValue){
                        if(!newValue[1]) {
                            delete scope.selected.deptId
                            return;
                        }
                        reloadClasses();
                        reloadUsers();
                    }
                    function classChanged(newValue){
                        if(!newValue[1]) {
                            delete scope.selected.classId
                            return;
                        }
                        reloadUsers();
                    }
                    function canFinish(){
                        for(var i in scope.filters){
                            if(scope.filters[i]) return true;
                        }
                        return false;
                    }
                    function setModel(){
                        var filter;
                        ctrl.$setViewValue(filter);
                        filter = prepareFilter(true);
                        ctrl.$setViewValue(filter);
                        if(scope.onChange) scope.onChange(filter);

                    }
                    function prepareFilter(throwError){
                        var clickedFilters = [],
                            filters = [];
                        for(var i in hierarchy){
                            if(scope.filters[hierarchy[i]]){
                                clickedFilters.push(hierarchy[i]);
                            }
                        }
                        if(!clickedFilters.length){
                            if(throwError)
                                Alerts.danger({
                                    title:'Oops',
                                    content:"Please, select at least one filter",
                                    textOk:'Ok'
                                },function(){});
                            return false;
                        }
                        for(var i = 0; i < clickedFilters.length;i++){
                            var filterName = clickedFilters[i],
                                filter = _.findWhere(scope.allowedFilters,{id:filterName});
                            filter.value = scope.selected[filter.id + 'Id'];

                            if(!filter.value){
                                if(throwError)
                                    Alerts.danger({
                                        title:'Oops',
                                        content:"Please, select a valid " + filter.name.toLowerCase(),
                                        textOk:'Ok'
                                    },function(){});
                                return false;
                            }
                            filters.push(filter)
                        }

                        return filters;
                    }
                    ctrl.$render = function(){
                        if(ctrl.$modelValue){
                            _.each(ctrl.$modelValue,function(filter){
                                scope.selected[filter.id + 'Id'] = filter.value;
                                scope.filters[filter.id] = true;
                            })
                        }
                    };
                }

            }
        }
    ]
);
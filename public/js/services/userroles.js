'use strict';
(function(angular){
    angular.module('app').factory('UserRoles',function(){
        var self = this;
        self.setUser = function(user){
            self.user = angular.copy(user);
        }
        var checkPermissionFor = {
            'teacher':isTeacher,
            'advisor':isAdvisor,
            'admin':isAdmin
        }
        self.checkPermission = function(role){
            if(!self.user)
                throw new UserRoleException('Invalid user');
            if(!_.isFunction(checkPermissionFor[role]))
                throw new UserRoleException('Invalid role');
            return checkPermissionFor[role]();
        }
        self.canPlayAnyOf = function(roles){
            return _.some(roles,function(r){
                return self.checkPermission(r);
            });
        }
        function isTeacher(){return self.user.is_teacher}
        function isAdvisor(){return self.user.is_advisor}
        function isAdmin(){return self.user.is_organization_admin || self.user.is_super_admin}

        function UserRoleException(message,options) {
            this.message = message;
            this.options = options;
            this.name = "UserRoleException";
        }
        return self;
    })
}(angular));
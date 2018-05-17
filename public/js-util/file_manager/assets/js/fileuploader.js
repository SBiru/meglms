(function(window, angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileUploader', ['$http', '$config', function ($http, $config) {
        var self = this;
        self.requesting = false; 
        self.upload = function(fileList, path, success, error) {
            for (var file=0;fileList.length>file;file++) {
                var form = new window.FormData();
                form.append('destination', '/' + path.join('/'));
                form.append('class_id', window.class_id);
                form.append('unzip', fileList.unzip);
                var fileObj = fileList[file];
                typeof fileObj === 'object' && form.append('file-1', fileObj);
                self.requesting = true;
                $http.post($config.uploadUrl, form, {
                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}
                }).success(function(data) {
                    self.requesting = false;
                    typeof success === 'function' && success(data);
                }).error(function(data) {
                    self.requesting = false;
                    typeof error === 'function' && error(data);
                });
                form = [];
            }
        };
    }]);
})(window, angular);
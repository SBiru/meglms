(function(window, angular, $) {
    "use strict";
    angular.module('FileManagerApp').factory('item', ['$http', '$translate', '$config', 'chmod', function($http, $translate, $config, Chmod) {

        var Item = function(model, path) {
            var rawModel = {
                name: '',
                path: path || [],
                type: 'file',
                size: 0,
                class_id: '',
                date: new Date(model && model.date || null),
                perms: new Chmod(model && model.rights),
                content: '',
                recursive: false,
                sizeKb: function() {
                    return Math.round(this.size / 1024, 1);
                },
                fullPath: function() {
                    return ('/' + this.path.join('/') + '/' + this.name).replace(new RegExp('\/\/'), '/');
                }
            };

            this.error = '';
            this.inprocess = false;
            this.model = angular.copy(rawModel);
            this.tempModel = angular.copy(rawModel);

            this.update = function() {
                angular.extend(this.model, angular.copy(this.tempModel));
                return this;
            };

            this.revert = function() {
                angular.extend(this.tempModel, angular.copy(this.model));
                this.error = '';
                return this;
            };

            angular.extend(this.model, model);
            angular.extend(this.tempModel, model);
        };

        Item.prototype.defineCallback = function(data, success, error) {
            /* Check if there was some error in a 200 response */
            var self = this;
            if (data.result && data.result.error) {
                self.error = data.result.error;
                return typeof error === 'function' && error(data);
            }
            if (data.error) {
                self.error = data.error.message;
                return typeof error === 'function' && error(data);
            }
            self.update();
            return typeof success === 'function' && success(data);
        };

        Item.prototype.createFolder = function(success, error) {
            var self = this;
            if (typeof window.class_id === 'undefined'){
                     window.class_id = '';
            }
            var data = {params: {
                mode: "addfolder",
                path: self.tempModel.path.join('/'),
                name: self.tempModel.name,
                class_id: window.class_id
            }};

            if (self.tempModel.name.trim()) {
                self.inprocess = true;
                self.error = '';
                $http.post($config.createFolderUrl, data).success(function(data) {
                    self.defineCallback(data, success, error);
                }).error(function(data) {
                    self.error = data.result && data.result.error ?
                        data.result.error:
                        $translate.instant('error_creating_folder');
                    typeof error === 'function' && error(data);
                })['finally'](function() {
                    self.inprocess = false;
                });
            }
            return self;
        };

        Item.prototype.rename = function(success, error) {
            var self = this;
            var data = {params: {
                "mode": "rename",
                "path": self.model.fullPath(),
                "newPath": self.tempModel.fullPath()
            }};
            if (self.tempModel.name.trim()) {
                self.inprocess = true;
                self.error = '';
                $http.post($config.renameUrl, data).success(function(data) {
                    self.defineCallback(data, success, error);
                }).error(function(data) {
                    self.error = data.result && data.result.error ?
                        data.result.error:
                        $translate.instant('error_renaming');
                    typeof error === 'function' && error(data);
                })['finally'](function() {
                    self.inprocess = false;
                });
            }
            return self;
        };

        Item.prototype.copy = function(success, error) {
            var self = this;
            var data = {params: {
                mode: "copy",
                path: self.model.fullPath(),
                newPath: self.tempModel.fullPath()
            }};
            if (self.tempModel.name.trim()) {
                self.inprocess = true;
                self.error = '';
                $http.post($config.copyUrl, data).success(function(data) {
                    self.defineCallback(data, success, error);
                }).error(function(data) {
                    self.error = data.result && data.result.error ?
                        data.result.error:
                        $translate.instant('error_copying');
                    typeof error === 'function' && error(data);
                })['finally'](function() {
                    self.inprocess = false;
                });
            }
            return self;
        };

        Item.prototype.compress = function(success, error) {
            var self = this;
            var data = {params: {
                mode: "compress",
                path: self.model.fullPath(),
                destination: self.tempModel.fullPath()
            }};
            if (self.tempModel.name.trim()) {
                self.inprocess = true;
                self.error = '';
                $http.post($config.compressUrl, data).success(function(data) {
                    self.defineCallback(data, success, error);
                }).error(function(data) {
                    self.error = data.result && data.result.error ?
                        data.result.error:
                        $translate.instant('error_compressing');
                    typeof error === 'function' && error(data);
                })['finally'](function() {
                    self.inprocess = false;
                });
            }
            return self;
        };

        Item.prototype.extract = function(success, error) {
            var self = this;
            var data = {params: {
                mode: "extract",
                path: self.model.fullPath(),
                sourceFile: self.model.fullPath(),
                destination: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';
            return $http.post($config.extractUrl, data).success(function(data) {
                self.defineCallback(data, success, error);
            }).error(function(data) {
                self.error = data.result && data.result.error ?
                    data.result.error:
                    $translate.instant('error_extracting');
                typeof error === 'function' && error(data);
            })["finally"](function() {
                self.inprocess = false;
            });

            return self;
        };

        Item.prototype.download = function(preview) {
            var self = this;
            var data = {
                mode: "download",
                preview: preview,
                name: self.model.id,
                path: self.model.fullPath()
            };
            //var url =  [window.location.origin + $config.downloadFileUrl, $.param(data)].join('?');

            var from_SCORM = false;
            var cname = "from_SCORM";
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0)
                    from_SCORM = c.substring(name.length, c.length);
            }

            var url =  window.location.origin + '/public/useruploads/' + self.model.urlpath;
            if(from_SCORM)
                var res = window.prompt("Click OK to copy the SCORM package URL", url);
            else
                window.prompt("Copy to clipboard press: Ctrl+C or Cmd+C for Macs", url);
            var d = new Date();
            d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
            if(res)
            document.cookie = "url=" + url + "; " + "expires=" + d.toUTCString() + '; path=/';
            return false;
        };

        Item.prototype.preview = function() {
            var self = this;
            return self.download(true);
        };

        Item.prototype.getContent = function(success, error) {
            var self = this;
            
            var data = {params: {
                mode: "editfile",
                path: self.tempModel.fullPath()
            }};
            self.inprocess = true;
            self.error = '';
            $http.post($config.getContentUrl, data).success(function(data) {
                self.tempModel.content = self.model.content = data.result;
                self.defineCallback(data, success, error);
            }).error(function(data) {
                self.error = data.result && data.result.error ?
                    data.result.error:
                    $translate.instant('error_getting_content');
                typeof error === 'function' && error(data);
            })['finally'](function() {
                self.inprocess = false;
            });
            return self;
        };

        Item.prototype.remove = function(success, error) {
            var self = this;
            var data = {params: {
                mode: "delete",
                path: self.tempModel.fullPath(),
                id: self.tempModel.id,
                urlpath: self.tempModel.urlpath,
                type: self.tempModel.type,
                name: self.tempModel.name,
            }};
            self.inprocess = true;
            self.error = '';
            $http.post($config.removeUrl, data).success(function(data) {
                self.defineCallback(data, success, error);
            }).error(function(data) {
                self.error = data.result && data.result.error ?
                    data.result.error:
                    $translate.instant('error_deleting');
                typeof error === 'function' && error(data);
            })['finally'](function() {
                self.inprocess = false;
            });
            return self;
        };

        Item.prototype.edit = function(success, error) {
            var self = this;
            var data = {params: {
                mode: "savefile",
                content: self.tempModel.content,
                path: self.tempModel.fullPath()
            }};
            self.inprocess = true;
            self.error = '';

            $http.post($config.editUrl, data).success(function(data) {
                self.defineCallback(data, success, error);
            }).error(function(data) {
                self.error = data.result && data.result.error ?
                    data.result.error:
                    $translate.instant('error_modifying');
                typeof error === 'function' && error(data);
            })['finally'](function() {
                self.inprocess = false;
            });
            return self;
        };

        Item.prototype.changePermissions = function(success, error) {
            var self = this;
            var data = {params: {
                mode: "changepermissions",
                path: self.tempModel.fullPath(),
                perms: self.tempModel.perms.toOctal(),
                permsCode: self.tempModel.perms.toCode(),
                recursive: self.tempModel.recursive
            }};
            self.inprocess = true;
            self.error = '';
            $http.post($config.permissionsUrl, data).success(function(data) {
                self.defineCallback(data, success, error);
            }).error(function(data) {
                self.error = data.result && data.result.error ?
                    data.result.error:
                    $translate.instant('error_changing_perms');
                typeof error === 'function' && error(data);
            })['finally'](function() {
                self.inprocess = false;
            });
            return self;
        };

        Item.prototype.isFolder = function() {
            return this.model.type === 'dir';
        };

        Item.prototype.isEditable = function() {
            return !this.isFolder() && !!this.model.name.toLowerCase().match(new RegExp($config.isEditableFilePattern));
        };

        Item.prototype.isImage = function() {
            return !!this.model.name.toLowerCase().match(new RegExp($config.isImageFilePattern));
        };

        Item.prototype.isCompressible = function() {
            return this.isFolder();
        };

        Item.prototype.isExtractable = function() {
            return !!(!this.isFolder() && this.model.name.match($config.isExtractableFilePattern));
        };

        return Item;
    }]);
})(window, angular, jQuery);
(function (angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileNavigator', [
        '$http', '$config', 'item',
        function ($http, $config, Item) {

            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            var FileNavigator = function () {
                this.requesting = false;
                this.fileList = [];
                this.currentPath = [];
                this.history = [];
                this.error = '';
            };

            FileNavigator.prototype.refresh = function (success, error) {
                var self = this;
                var path = self.currentPath.join('/');
                var data = {
                    params: {
                        mode: "list",
                        onlyFolders: false,
                        path: '/' + path,
                        class_id: window.class_id
                    }
                };

                self.requesting = true;
                self.fileList = [];
                if (typeof self.classFolders === 'undefined') {
                    self.classFolders = ['Root'];
                    self.classFoldersOnce = 0;
                }
                self.error = '';
                $http.post($config.listUrl, data).success(function (data) {
                    self.fileList = [];
                    angular.forEach(data.result, function (file) {
                        var colorstyle = 0;
                        if ((typeof self.currentPath[0] !== 'undefined') && (self.currentPath[0] === 'My Folder')){
                                    file.colorstyle = true;
                                    colorstyle = 1;
                        }

                        if (
                        (file.class_id === "0") 
                        && (self.currentPath.length === 0)
                        && (file.name === "My Folder")
                        ){
                            file.colorstyle = true;
                        }
                        else{
                          if (colorstyle === 0){          
                          file.colorstyle = false;
                          }
                        }

                        if (self.currentPath.length === 0){
                                    file.noShow = true;
                                    self.noShow = true;
                        }
                        else{
                                    file.noShow = false;
                                    self.noShow = false;  
                        }

                        self.fileList.push(new Item(file, self.currentPath));
                        if (self.classFoldersOnce === 0) {
                            if (self.currentPath.length === 0) {
                                if ((file.class_id !== '0'))
                                    self.classFolders.push(file.name)
                            }
                        }
                    });

                    if (typeof self.classRootName === "string") {
                        var tmp = self.classRootName;
                        delete self.classRootName;
                        for (var i = 0; i < self.fileList.length; i++) {
                            if (self.fileList[i].model.name === tmp) {
                                self.folderClick(self.fileList[i]);
                                break;
                                return;
                            }
                        }

                    }

                    if (self.classFoldersOnce === 0){
                    self.classFolders.push('My Folder');
                    }
                    
                    self.classFoldersOnce = 1;
                    self.requesting = false;
                    self.buildTree(path);

                    if (data.error) {
                        self.error = data.error;
                        return typeof error === 'function' && error(data);
                    }
                    typeof success === 'function' && success(data);
                }).error(function (data) {
                    self.requesting = false;
                    typeof error === 'function' && error(data);
                });
            };

            FileNavigator.prototype.buildTree = function (path) {
                var self = this;
                var recursive = function (parent, file, path) {
                    var absName = path ? (path + '/' + file.name) : file.name;
                    if (parent.name && !path.match(new RegExp('^' + parent.name))) {
                        parent.nodes = [];
                    }
                    if (parent.name !== path) {
                        for (var i in parent.nodes) {
                            recursive(parent.nodes[i], file, path);
                        }
                    } else {
                        for (var i in parent.nodes) {
                            if (parent.nodes[i].name === absName) {
                                return;
                            }
                        }
                        parent.nodes.push({
                            name: absName,
                            nodes: []
                        });
                    }
                };

                !self.history.length && self.history.push({
                    name: path,
                    nodes: []
                });
                for (var i in self.fileList) {
                    var file = self.fileList[i].model;
                    file.type === 'dir' && recursive(self.history[0], file, path);
                }
            };

            FileNavigator.prototype.folderClickByName = function (fullPath) {
                var self = this;
                fullPath = fullPath.replace(new RegExp("^\/*", "g"), '').split('/');
                self.currentPath = fullPath && fullPath[0] === "" ? [] : fullPath;
                self.refresh();
            };

            FileNavigator.prototype.folderClick = function (item) {
                var self = this;
                if (item && item.model.type === 'dir') {
                    self.currentPath.push(item.model.name);
                    self.refresh();
                }
            };

            FileNavigator.prototype.upDir = function () {
                var self = this;
                if (self.currentPath[0]) {
                    self.currentPath = self.currentPath.slice(0, -1);
                    if (self.currentPath.length === 0) {
                        window.class_id = '';
                    }
                    self.refresh();
                } else {
                    window.class_id = '';
                }
            };

            FileNavigator.prototype.goTo = function (index) {
                var self = this;
                self.currentPath = self.currentPath.slice(0, index + 1);
                if (self.currentPath.length === 0) {
                    window.class_id = '';
                }
                if (typeof self.ClassitemKeep === 'undefined'){
                self.Classitem = 'Root';
                }
                else{
                        delete self.ClassitemKeep;
                }
                self.refresh();
            };

            FileNavigator.prototype.fileNameExists = function (fileName) {
                var self = this;
                for (var item in self.fileList) {
                    item = self.fileList[item];
                    if (fileName.trim && item.model.name.trim() === fileName.trim()) {
                        return true;
                    }
                }
            };

            FileNavigator.prototype.listHasFolders = function () {
                var self = this;
                for (var item in self.fileList) {
                    if (self.fileList[item].model.type === 'dir') {
                        return true;
                    }
                }
            };

            return FileNavigator;
        }
    ]);
})(angular);
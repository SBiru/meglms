    angular.module('FileManagerApp').controller('FileManagerCtrl', [
    '$scope', '$translate', '$cookies', '$config', 'item', 'fileNavigator', 'fileUploader',
    function($scope, $translate, $cookies, $config, Item, FileNavigator, FileUploader) {

        $scope.config = $config;
        $scope.appName = $config.appName;
        $scope.orderProp = ['model.type', 'model.name'];
        $scope.query = '';
        $scope.temp = new Item();
        $scope.fileNavigator = new FileNavigator();
        $scope.fileUploader = FileUploader;
        $scope.uploadFileList = [];
        $scope.viewTemplate = $cookies.viewTemplate || 'main-table.html';

        $scope.setTemplate = function(name) {
            $scope.viewTemplate = $cookies.viewTemplate = name;
        };

        $scope.changeLanguage = function (locale) {
            if (locale) {
                return $translate.use($cookies.language = locale);
            }
            $translate.use($cookies.language || $config.defaultLang);
        };

        $scope.touch = function(item) {
            item = (item && item.revert && item) || new Item();
            item.revert && item.revert();
            $scope.temp = item;
        };

        $scope.classChange = function(name){
               $scope.fileNavigator.classRootName = name;
               $scope.fileNavigator.ClassitemKeep = 1;
               $scope.fileNavigator.goTo(-1)
        }

        $scope.smartRightClick = function(item) {
            $scope.touch(item);
        };

        $scope.smartClick = function(item) {
            window.class_id = item.model.class_id;
            $scope.fileNavigator.Classitem = item.model.name;
             if (parseInt(item.model.class_id) === 0){
                     item.model.colorstyle = true;
             }

             if (item.model.path.length <=0){
                     $scope.fileNavigator.noShow = false;
             }
            
            if (item.isFolder()) {
                return $scope.fileNavigator.folderClick(item);
            };
            return item.preview();
            if (item.isImage()) {
                return item.preview();
            }
            if (item.isEditable()) {
                item.getContent();
                $scope.touch(item);
                $('#edit').modal('show');
                return;
            }
        };

        $scope.edit = function(item) {
            item.edit(function() {
                $('#edit').modal('hide');
            });
        };

        $scope.changePermissions = function(item) {
            item.changePermissions(function() {
                $('#changepermissions').modal('hide');
            });
        };

        $scope.copy = function(item) {
            var samePath = item.tempModel.path.join() === item.model.path.join();
            if (samePath && $scope.fileNavigator.fileNameExists(item.tempModel.name)) {
                item.error = $translate.instant('error_invalid_filename');
                return false;
            }
            item.copy(function() {
                $scope.fileNavigator.refresh();
                $('#copy').modal('hide');
            });
        };

        $scope.compress = function(item) {
            item.compress(function() {
                item.success = true;
                $scope.fileNavigator.refresh();
            }, function() {
                item.success = false;
            });
        };

        $scope.extract = function(item) {
            item.extract(function() {
                item.success = true;
                $scope.fileNavigator.refresh();
            }, function() {
                item.success = false;
            });
        };

        $scope.remove = function(item) {
            item.remove(function() {
                $scope.fileNavigator.refresh();
                $('#delete').modal('hide');
            });
        };

        $scope.rename = function(item) {
            var samePath = item.tempModel.path.join() === item.model.path.join();
            if (samePath && $scope.fileNavigator.fileNameExists(item.tempModel.name)) {
                item.error = $translate.instant('error_invalid_filename');
                return false;
            }
            item.rename(function() {
                $scope.fileNavigator.refresh();
                $('#rename').modal('hide');
            });
        };

        $scope.createFolder = function(item) {
            var name = item.tempModel.name && item.tempModel.name.trim();
            item.tempModel.type = 'dir';
            item.tempModel.path = $scope.fileNavigator.currentPath;
            if (name && !$scope.fileNavigator.fileNameExists(name)) {
                item.createFolder(function() {
                    $scope.fileNavigator.refresh();
                    $('#newfolder').modal('hide');
                });
            } else {
                $scope.temp.error = $translate.instant('error_invalid_filename');
                return false;
            }
        };

        $scope.uploadFiles = function() {
            $scope.fileUploader.upload($scope.uploadFileList,
                $scope.fileNavigator.currentPath, function() {
                $scope.fileNavigator.refresh();
                $('#uploadfile').modal('hide');
            });
        };

        $scope.getQueryParam = function(param) {
            var found;
            window.location.search.substr(1).split("&").forEach(function(item) {
                if (param ===  item.split("=")[0]) {
                    found = item.split("=")[1];
                }
            });
            return found;
        };

        $scope.changeLanguage($scope.getQueryParam('lang'));
        $scope.isWindows = $scope.getQueryParam('server') === 'Windows';
        $scope.fileNavigator.refresh();

    }]);
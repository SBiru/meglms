(function(angular) {
    "use strict";
    angular.module('FileManagerApp').constant("$config", {
        appName: "File Manager",
        defaultLang: "en",

        listUrl: "../../filesandfolders/initial",
        uploadUrl: "../../filesandfolders/upload",

        renameUrl: "../../filesandfolders/rename",
        copyUrl: "../../filesandfolders/copy",
        removeUrl: "../../filesandfolders/remove",
        editUrl: "../../filesandfolders/edit",
        getContentUrl: "bridges/php/handler.php",
        createFolderUrl: "../../filesandfolders/createfolder",
        downloadFileUrl: "/filesandfolders/download",
        compressUrl: "../../filesandfolders/compress",
        extractUrl: "../../filesandfolders/extract",
        permissionsUrl: "../../filesandfolders/permissions/set",

        enablePermissionsModule: true,
        enablePermissionsRecursive: true,
        enableCompressChooseName: false,

        isEditableFilePattern: '\\.(txt|html|htm|aspx|asp|ini|pl|py|md|php|css|js|log|htaccess|htpasswd|json)$',
        isImageFilePattern: '\\.(jpg|jpeg|gif|bmp|png|svg|tiff)$',
        isExtractableFilePattern: '\\.(zip|gz|tar|rar|gzip)$'
    });
})(angular);
/**
 * This controller is in charge of keeping track of context for the admin page.
 */
appControllers.controller('TranslationsController', ['$rootScope', '$scope', 'Languages',
    function($rootScope, $scope, Languages) {
        $scope.languageId = $rootScope.$stateParams.languageId;
        $scope.translationsForSelection = {};
        var oldTranslations = {};
        Languages.translations({languageId: $scope.languageId}, function(response){
            var translationsObj = new Object();
            for(var i = 0; i < response.translations.length; i++){
                translationsObj[response.translations[i].nav_key] = response.translations[i].translation;
                $scope[response.translations[i].nav_key + 'Translation'] = response.translations[i].translation;
                oldTranslations[response.translations[i].nav_key + 'Translation'] = response.translations[i].translation;
            }
            $scope.translationsForSelection = translationsObj;
        });

        $scope.submit_translations = function(){
            var updateKeys = {};
            for(var key in $scope){
                if(key.indexOf("Translation")<0)
                    continue;
                var nav_key = key.replace("Translation","");
                /*
                We want to send only translations that have been modified
                 */
                if($scope[key]!="" && $scope[key]!= oldTranslations[key])
                    updateKeys[nav_key]= $scope[key];
            }

            Languages.update({
                language_id :$scope.languageId,
                keys: updateKeys
            },function(response){
                if(response.message=='successful')
                    toastr.success("Updated translations")
                else
                    toastr.error(response.message)
            });
        };

        console.log($scope.languageId);

        $rootScope.$broadcast('TranslationsMenu');
    }
]);
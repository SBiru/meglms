var createPreferences = function () {
    return [
        {
            prompt: "Page title",
            type: 'text',
            key: 'page_title'
        }, {
            prompt: "Page type",
            type: 'text',
            key: 'page_type'
        }, {
            prompt: "Page group",
            type: 'text',
            key: 'page_group'
        }, {
            prompt: "Objective",
            type: 'text',
            key: 'objective'
        }, {
            prompt: "Task Duration",
            type: 'text',
            key: 'taskDuration'
        }, {
            prompt: "Task Type",
            type: 'text',
            key: 'taskType'
        }, {
            prompt: "Translation",
            type: 'text',
            key: 'pageSubTitle'
        }, {
            prompt: "Password",
            type: 'text',
            key: 'password'
        }, {
            prompt: "Hide from students",
            type: 'boolean',
            key: 'hide_activity'
        }, {
            prompt: "Should be completed before continue",
            type: 'boolean',
            key: 'is_gate'
        }, {
            prompt: "Show create date",
            type: 'boolean',
            key: 'show_created_date'
        }, {
            prompt: "Show objectives",
            type: 'boolean',
            key: 'show_objectives'
        }, {
            prompt: "Show frame around page",
            type: 'boolean',
            key: 'use_frame'
        }, {
            prompt: "This assignment requires submission",
            type: 'boolean',
            key: 'require_submission'
        }, {
            prompt: "Make posts private",
            type: 'boolean',
            key: 'private_posts'
        }, {
            prompt: "Make posts gradeable",
            type: 'boolean',
            key: 'is_gradeable'
        }, {
            prompt: "Max points",
            type: 'text',
            key: 'max_points'
        }, {
            prompt: "Quiz",
            type: 'text',
            key: 'quiz'
        }, {
            prompt: "Search text (Page: Quiz list)",
            type: 'text',
            key: 'search_text'
        }, {
            prompt: "Time limit",
            type: 'text',
            key: 'time_limit'
        }, {
            prompt: "Max attempts",
            type: 'text',
            key: 'max_attempts'
        }, {
            prompt: "Vocab Group (Page: Vocab Quiz)",
            type: 'text',
            key: 'vocab_group'
        }, {
            prompt: "Vocab Group (Page: Vocab Activity)",
            type: 'text',
            key: 'vocab'
        }, {
            prompt: "Pause time (Page: Timed review)",
            type: 'text',
            key: 'pause_time'
        }, {
            prompt: "Timed title (Page: Timed review)",
            type: 'text',
            key: 'timed_title'
        }
        , {
            prompt: "Timed description (Page: Timed review)",
            type: 'text',
            key: 'timed_description'
        }


    ];
};
appControllers.controller('OrganizationPreferencesButtonController', [
    '$scope',
    '$modal',
    function ($scope, $modal) {

        $scope.open = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/admin/organization_preferences.html',
                controller: 'OrganizationPreferencesController',
                size: 'lg',
                windowClass: 'organization-preferences-window',
            });
        }

    }
]);

appControllers.controller('OrganizationPreferencesController', [
    '$scope',
    '$modalInstance',
    'CurrentOrganizationId',
    'OrganizationV2',
    function ($scope, $modalInstance, CurrentOrganizationId, OrganizationV2) {
        $scope.cancel = cancel;
        $scope.update = update;
        $scope.preferences = createPreferences();
        $scope.loading = {};

        var id = CurrentOrganizationId.getOrganizationId();

        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        function getInfo() {
            OrganizationV2.get({id: id}, function (org) {
                for (var preference in org.preferences) {
                    if (org.preferences.hasOwnProperty(preference)) {
                        if (preference.indexOf('_tooltip') > 0) {
                            var key = preference.replace('_tooltip', '');
                            var element = _.find($scope.preferences, function (el) {
                                return el.key == key;
                            });
                            element.tooltip = org.preferences[preference];
                        } else {
                            var element = _.find($scope.preferences, function (el) {
                                return el.key == preference;
                            });
                            element.value = org.preferences[preference];
                        }
                    }
                }
            });
        }

        function update() {
            var preferenceArray = {id: id};
            for (var i in $scope.preferences) {
                var preference = $scope.preferences[i];
                if (preference.value)
                    preferenceArray[preference.key] = preference.value;
                if (preference.tooltip)
                    preferenceArray[preference.key + '_tooltip'] = preference.tooltip
            }

            $scope.loading.orgPreferences = 1;

            OrganizationV2.updatePreferences(preferenceArray, function (ok) {
                $scope.loading.orgPreferences = 0;
                $modalInstance.close();
            }, function (error) {
                $scope.loading.orgPreferences = 2;
            })
        }

        getInfo();


    }
]);
angular.module('app')

    /*
     * All current students report
     * */

    .directive('differentPages',
    [ '$q','UserV2','Report','OrganizationV2',
        function($q,UserV2,Report,OrganizationV2) {
            return {
                restrict: 'E',
                scope: {

                },
                template: '<report-type-1 ng-if="config" config="config"></report-type-1>',
                link: function ($scope) {
                    $scope.config={
                        'endpoint':'different-pages',
                        'chart_bottom_text':'Avg. Different pages:',
                        'right_panel_label':'Students',
                        studentTableHeader:[
                            {'id':'last_name',label:'Student',rowTemplate:'{{data.last_name}}, {{data.first_name}}'},
                            {'id':'diffPages',label:'Pages'}

                        ],
                        hide_right_panel_label:true

                    };
                }
            }
        }
    ]);


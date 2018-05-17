angular.module('app')

    /*
     * All current students report
     * */

    .directive('postsPerStudent',
    [ '$q','UserV2','Report','OrganizationV2',
        function($q,UserV2,Report,OrganizationV2) {
            return {
                restrict: 'E',
                scope: {

                },
                template: '<report-type-1 ng-if="config" config="config"></report-type-1>',
                link: function ($scope) {
                    $scope.config={
                        'endpoint':'posts-per-student',
                        'chart_bottom_text':'Avg. Posts:',
                        'right_panel_label':'Posts',
                        studentTableHeader:[
                            {'id':'last_name',label:'Student',rowTemplate:'{{data.last_name}}, {{data.first_name}}'},
                            {'id':'postCount',label:'Posts'}

                        ],
                        getRightPanelLabelValue:function(page,student){
                            if(student.id){
                                return page.students[student.id]
                            }
                            return page.itemsPerPage;
                        }

                    };
                }
            }
        }
    ]);


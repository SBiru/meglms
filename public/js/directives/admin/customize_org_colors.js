'use strict';
(function(angular){
    angular.module('app').directive("customizeOrgColors",
        ['OrganizationV2',function(OrganizationV2){
            return{

                restrict:'E',
                templateUrl:'/public/views/directives/admin/customize_org_colors.html?v='+window.currentJsVersion,
                scope:{
                    styleSettings:'=?',
                    defaultStyleSettings:'=?',
                    isOpened:'=?'
                },
                link:function(scope){
                    scope.vc = {};
                    scope.cancel = function(){
                        scope.isOpened=false;
                    }

                    scope.availableDateFormats = ['MMM-DD YY','MMM DD'];
                    scope.availableColorGroups = [
                        {
                            group:true,
                            title:'Top Nav',
                            availableColorGroups:[
                                {
                                    id:'color_header_text',
                                    label:'Header text'
                                },
                                {
                                    id:'color_header_text_hover',
                                    label:'Header text mouse over'
                                },
                                {
                                    id:'color_header_menu_text_hover',
                                    label:'Header menu text mouse over'
                                },
                                {
                                    id:'color_header_text_hover_background',
                                    label:'User preference text mouse over background'
                                },
                                {
                                    id:'color_header_background',
                                    label:'Header background'
                                },
                                {
                                    id:'color_header_border',
                                    label:'Header border'
                                },
                                {
                                    id:'color_top_icons',
                                    label:'Top icons'
                                },
                                {
                                    id:'color_topbar_badge',
                                    label:'Top icons badge'
                                },
                                {
                                    id:'color_top_icons_hover',
                                    label:'Top icons mouse over'
                                }
                            ]
                        },
                        {
                            group:true,
                            title:'Left Menu',
                            availableColorGroups:[
                                {
                                    id:'color_left_menu_background',
                                    label:'Left menu background'
                                },
                                {
                                    id:'color_left_menu_item',
                                    label:'Left menu item'
                                },
                                {
                                    id:'color_left_menu_item_background',
                                    label:'Left menu item background'
                                },
                                {
                                    id:'color_left_menu_selected_item',
                                    label:'Left menu selected item '
                                },
                                {
                                    id:'color_left_menu_selected_item_background',
                                    label:'Left menu selected item background'
                                },
                                {
                                    id:'color_left_menu_grades_item',
                                    label:'Left menu grades item'
                                },
                                {
                                    id:'color_left_menu_grades_item_background',
                                    label:'Left menu grades item background'
                                },
                                {
                                    id:'color_left_menu_selected_grades_item',
                                    label:'Left menu grades selected item '
                                },
                                {
                                    id:'color_left_menu_selected_grades_item_background',
                                    label:'Left menu grades selected item background'
                                },
                                {
                                    id:'color_left_menu_completion_box',
                                    label:'Left menu completion box border'
                                },
                                {
                                    id:'color_left_menu_completion_box_selected',
                                    label:'Left menu completion box selected item border'
                                },
                                {
                                    id:'color_left_menu_tab',
                                    label:'Left menu tab'
                                },
                                {
                                    id:'color_left_menu_tab_border',
                                    label:'Left menu tab border'
                                },
                                {
                                    id:'color_left_menu_tab_background',
                                    label:'Left menu tab background'
                                },
                                {
                                    id:'color_left_menu_selected_tab',
                                    label:'Left menu selected tab'
                                },
                                {
                                    id:'color_left_menu_selected_tab_background',
                                    label:'Left menu selected tab background'
                                },

                                {
                                    id:'color_course_name',
                                    label:'Left menu course name'
                                },
                                {
                                    id:'color_left_menu_checkmark',
                                    label:'Left menu checkmark'
                                }
                            ]
                        },
                        {
                            group: true,
                            title: 'Right Panels',
                            availableColorGroups: [
                                {
                                    id:'color_right_panels_tab',
                                    label:'Right panels tab'
                                },
                                {
                                    id:'color_right_panels_tab_background',
                                    label:'Right panels tab background'
                                },
                                {
                                    id:'color_right_panels_selected_tab',
                                    label:'Right panels selected tab'
                                },
                                {
                                    id:'color_right_panels_selected_tab_background',
                                    label:'Right panels selected tab background'
                                },
                                {
                                    id:'color_course_arrows',
                                    label:'Course arrows'
                                }
                            ]
                        },
                        {
                            group: true,
                            title: 'Flash Cards',
                            availableColorGroups: [
                                {
                                    id:'color_flashcards_progressbar',
                                    label:'Flashcards progress bar'
                                }
                            ]
                        },
                        {
                            group: true,
                            title: 'Test Dashboard',
                            availableColorGroups: [
                                {
                                    id:'color_test_dashboard_font',
                                    label:'Test dashboard font color'
                                },
                                {
                                    id:'color_test_dashboard_background',
                                    label:'Test dashboard background color'
                                },
                                {
                                    id:'color_nav_progress_circle',
                                    label:'No menu progress bar color'
                                }
                            ]
                        },
                        {
                            group: true,
                            title: 'Post Buttons',
                            availableColorGroups: [
                                {
                                    id:'color_btn_post',
                                    label:'Post button color'
                                },
                                {
                                    id:'color_btn_post_background',
                                    label:'Post button background color'
                                },
                                {
                                    id:'color_btn_post_border',
                                    label:'Post button border color'
                                },
                                {
                                    id:'color_btn_post_hover',
                                    label:'Post button mouse over color'
                                }
                            ]

                        },
                        {
                            group:true,
                            title:'J1 Dashboard',
                            availableColorGroups:[
                                {
                                    id:'color_j1_dashboard_left_text',
                                    label:'J1 dashboard left texts'
                                },
                                {
                                    id:'color_j1_dashboard_left_circle',
                                    label:'J1 dashboard left circle'
                                },
                                {
                                    id:'color_j1_dashboard_right_text',
                                    label:'J1 dashboard right texts'
                                },
                                {
                                    group:true,
                                    title:'Right side buttons',
                                    availableColorGroups:[
                                        {
                                            id:'color_j1_dashboard_right_buttons_color',
                                            label:'Button color'
                                        },
                                        {
                                            id:'color_j1_dashboard_right_buttons_border',
                                            label:'Button border'
                                        },
                                        {
                                            id:'color_j1_dashboard_right_buttons_background',
                                            label:'Button background'
                                        }
                                    ]
                                },
                                {
                                    group:true,
                                    title:'Start Interview Button',
                                    availableColorGroups:[
                                        {
                                            id:'color_j1_start_button_border',
                                            label:'Button start j1 interview border'
                                        },
                                        {
                                            id:'color_j1_start_button_background',
                                            label:'Button start j1 interview background'
                                        },
                                        {
                                            id:'color_j1_start_button_font_color',
                                            label:'Button start j1 interview font color'
                                        },
                                        {
                                            id:'color_j1_start_button_border_hover',
                                            label:'Button start j1 interview  border hover'
                                        },
                                        {
                                            id:'color_j1_start_button_background_hover',
                                            label:'Button start j1 interview background hover'
                                        },
                                        {
                                            id:'color_j1_start_button_font_color_hover',
                                            label:'Button start j1 interview font color hover'
                                        }
                                    ]
                                },
                                {
                                    group:true,
                                    title:'Practice Interview Button',
                                    availableColorGroups:[
                                        {
                                            id:'color_j1_practice_button_border',
                                            label:'Button practice j1 interview border'
                                        },
                                        {
                                            id:'color_j1_practice_button_background',
                                            label:'Button practice j1 interview background'
                                        },
                                        {
                                            id:'color_j1_practice_button_font_color',
                                            label:'Button practice j1 interview font color'
                                        },
                                        {
                                            id:'color_j1_practice_button_border_hover',
                                            label:'Button practice j1 interview  border hover'
                                        },
                                        {
                                            id:'color_j1_practice_button_background_hover',
                                            label:'Button practice j1 interview background hover'
                                        },
                                        {
                                            id:'color_j1_practice_button_font_color_hover',
                                            label:'Button practice j1 interview font color hover'
                                        }
                                    ]
                                }
                            ]
                        }
                    ];
                    var changeTimeout;
                    scope.onSearchChange = function(){
                        scope.vc.startFiltering = true;
                        if(changeTimeout)
                            clearTimeout(changeTimeout);
                        changeTimeout = setTimeout(function(){
                            filterColors();
                            scope.$apply();
                            scope.vc.startFiltering = false;
                        },500);
                    }
                    function filterColors(){
                        if(!scope.search_color)
                            scope.filteredAvailableColorGroups = scope.availableColorGroups;
                        else{
                            scope.filteredAvailableColorGroups = _.filter(_.map(scope.availableColorGroups,function(colorGroup){
                                var filteredColors = getFilteredColors(colorGroup);
                                //     _.filter(colorGroup.availableColorGroups,function(c){
                                //     return c.label.toLowerCase().includes(scope.search_color.toLowerCase())
                                // })
                                if(filteredColors.length){
                                    return _.extend({},colorGroup,{availableColorGroups:filteredColors});
                                }
                                function getFilteredColors(colorGroup){
                                    return _.union.apply(null,_.map(colorGroup.availableColorGroups,function(c){
                                        if(c.group ){
                                            return getFilteredColors(c)
                                        }
                                        else return c.label.toLowerCase().includes(scope.search_color.toLowerCase())?[c]:[]
                                    }))
                                }
                            }))

                        }

                    }
                    scope.search_color = '';
                    filterColors();
                    scope.todayInGivenFormat = function(format){
                        return moment().format(format);
                    }
                    scope.reset = function(id){
                        if(id){
                            return scope.styleSettings[id]=scope.defaultStyleSettings[id];
                        }
                        _.each(scope.styleSettings,function(s,id){
                            scope.reset(id);
                        })
                    }
                }
            }
        }]
    )
}(angular))
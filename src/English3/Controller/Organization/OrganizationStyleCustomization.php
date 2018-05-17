<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 17.17.2
 * Time: 13:49
 */

namespace English3\Controller\Organization;


use English3\Controller\Utility;

class OrganizationStyleCustomization extends OrganizationPreferenceGroup {
    public static function fromUserId($id){
        $orgId = Utility::getInstance()->fetchOne('SELECT organizationid FROM users WHERE id = :id',['id'=>$id]);
        return new self($orgId);
    }
    public function createStyleSheet(){

        if(!$this->loaded){
            $this->load();
        }
        $creator = new StylesheetCreator($this->getPreferences());
        return $creator->createStyleSheet();
    }
    protected $orgFlag = 'white_label';
//-Header background
//-Header text
//-Top icons
//-Top icons mouse-over
//-Left menu item, course name
//-Left menu item background
//-Left menu selected item
//-Left menu selected item background
//-Left menu tab
//-Left menu selected tab
//-Left menu tab background
//-Left menu selected tab background
//-Platform mouse-over
    protected $defaults = [
        'due_date_format' => 'MMM-DD YY',
        'color_header_text' =>'#999',
        'color_header_text_hover' =>'#fff',
        'color_header_menu_text_hover'=>'fff',
        'color_header_text_hover_background' =>'#101010',
        'color_header_background' =>'#000',
        'color_header_border' =>'#080808',
        'color_top_icons' =>'#62c354',
        'color_topbar_badge' => '#62c354',
        'color_top_icons_hover' =>'#3c7733',
        'color_left_menu_background' =>'#f3f4f4',
        'color_left_menu_item' =>'#428bca',
        'color_left_menu_item_background' =>'#f3f4f4',
        'color_left_menu_selected_item' =>'#428bca',
        'color_left_menu_selected_item_background' =>'#d9d9d9',
        'color_left_menu_grades_item' =>'#000',
        'color_left_menu_grades_item_background' =>'#fff',
        'color_left_menu_selected_grades_item' =>'#fff',
        'color_left_menu_selected_grades_item_background' =>'#428bca',
        'color_left_menu_completion_box' => '#A4A3A3',
        'color_left_menu_completion_box_selected' => '#A4A3A3',
        'color_left_menu_tab' =>'#428bca',
        'color_left_menu_tab_border' =>'#bdbdbf',
        'color_left_menu_tab_background' =>'#e9e9ea',
        'color_left_menu_selected_tab' =>'#ffffff',
        'color_left_menu_selected_tab_background' =>'#428bca',
        'color_right_panels_tab' =>'#428bca',
        'color_right_panels_tab_background' =>'#e9e9ea',
        'color_right_panels_selected_tab' =>'#ffffff',
        'color_right_panels_selected_tab_background' =>'#428bca',
        'color_course_name' => '#000000',
        'color_left_menu_checkmark' => '#008000',
        'color_flashcards_progressbar' => '#b8b8b8',
        'color_test_dashboard_font' => '#62C354',
        'color_test_dashboard_background' => '#ffffff',
        'color_course_arrows' => '#428bca',
        'color_btn_post_background' => '#428bca',
        'color_btn_post_hover' => '#3276b1',
        'color_btn_post_border' => '#357ebd',
        'color_btn_post' => '#ffffff',
        'color_nav_progress_circle' => '#62c354',
        'color_j1_dashboard_left_text' => '#ab2121',
        'color_j1_dashboard_left_circle' => '#ab2121',
        'color_j1_dashboard_right_text' => '#1ebbd4',
        'color_j1_start_button_border'=>'#7a0000',
        'color_j1_start_button_background'=>'#7a0000',
        'color_j1_start_button_font_color'=>'#ffffff',
        'color_j1_start_button_border_hover'=>'#7a0000',
        'color_j1_start_button_background_hover'=>'#7a0000',
        'color_j1_start_button_font_color_hover'=>'#ffffff',
        'color_j1_practice_button_border'=>'#7a0000',
        'color_j1_practice_button_background'=>'#7a0000',
        'color_j1_practice_button_font_color'=>'#ffffff',
        'color_j1_practice_button_border_hover'=>'#7a0000',
        'color_j1_practice_button_background_hover'=>'#7a0000',
        'color_j1_practice_button_font_color_hover'=>'#ffffff',
        'color_j1_dashboard_right_buttons_color'=>'#0084bf',
        'color_j1_dashboard_right_buttons_border'=>'#0084bf',
        'color_j1_dashboard_right_buttons_background'=>'#ffffff'

    ];

}
class StylesheetCreator{
    private $styles;
    public function __construct($styles){
        $this->styles = $styles;
    }
    public function createStyleSheet(){
        $styleSheet = '<style>'.PHP_EOL;
        foreach($this->styles as $key=>$value){
            $styleSheet.= str_replace('__value__',$value,$this->styleDefinitions[$key]).PHP_EOL;
        }
        return $styleSheet.'</style>'.PHP_EOL;
    }

    private $styleDefinitions = [
        'color_header_text' =>'.dropdown-menu.user-preferences li a,.dropdown-menu.user-preferences li > div,.navbar-inverse .navbar-nav>.open>a,.navbar-inverse .navbar-nav>.open>a:hover,.navbar-inverse .navbar-nav>li>a, #mobileMenu .optionText {color: __value__ !important;}',
        'color_header_text_hover' =>'.navbar-inverse .navbar-nav>li>a:hover {color: __value__;}',
        'color_header_menu_text_hover' =>'.dropdown-menu.user-preferences>li>a:hover, .dropdown-menu.user-preferences>li>a:focus {color: __value__;}',
        'color_header_text_hover_background' =>'.dropdown-menu.user-preferences>li>a:hover, .dropdown-menu.user-preferences>li>a:focus {background-color: __value__;}',
        'color_header_background' =>'.navbar-inverse .navbar-nav>.open>a,.navbar-inverse .navbar-nav>.open>a:hover,.navbar-inverse, .dropdown-menu.user-preferences {background-color: __value__;}',
        'color_header_border' =>'.navbar-inverse .navbar-nav>.open>a,.navbar-inverse .navbar-nav>.open>a:hover,.navbar-inverse, .dropdown-menu.user-preferences {border-color: __value__;}',
        'color_top_icons' =>'.navbar-inverse .navbar-nav>li.menu-icon > span, .navbar-inverse .navbar-nav>li.menu-icon > a > span, .navbar-inverse .navbar-nav>li.menu-icon a,#mobileMenu .user-icon {color: __value__ !important;}',
        'color_top_icons_hover' =>'.navbar-inverse .navbar-nav>li.menu-icon:hover > span, .navbar-inverse .navbar-nav>li.menu-icon:hover > a > span, .navbar-inverse .navbar-nav>li.menu-icon:hover a {color: __value__ !important;}',
        'color_left_menu_background'=>'.class-sidebar,.sidebar {background-color: __value__;}',
        'color_left_menu_item'=>'.sidebar .nav:not(.course-units-nav)>li>a,.classes tr:not(.active) span,.sidebar-edit-item .move-arrows,.nav-list li div,.sidebar .sidebar-nav.nav-pills>li:not(.active)>a {color: __value__ !important;}',
        'color_left_menu_item_background'=>'.sidebar .nav:not(.course-units-nav)>li>a,.classes tr:not(.active) td,.sidebar .sidebar-nav.nav-pills>li:not(.active)>a {background-color: __value__ !important;}',
        'color_left_menu_grades_item'=>'.class-sidebar a.list-group-item,.class-sidebar a.list-group-item .list-group-item-heading {color: __value__ !important;}',
        'color_left_menu_grades_item_background'=>'.class-sidebar a.list-group-item {background-color: __value__ !important;}',
        'color_left_menu_selected_item'=>'.classes .active span,.nav-item.active div,.sidebar .nav-pills>li.active>a,.sidebar  .nav-pills>li.active>a:hover,.sidebar  .nav-pills>li.active>a:focus,.sidebar-edit-item.active .move-arrows,.sidebar .sidebar-nav.nav-pills>li.active div:not(.btn), .sidebar .sidebar-nav.nav-pills>li>a, .sidebar .sidebar-nav.nav-pills>li.active>a, .sidebar .sidebar-nav.nav-pills>li.active>a:hover, .sidebar .sidebar-nav.nav-pills>li.active>a:focus {color: __value__ !important;}',
        'color_left_menu_selected_item_background'=>'.classes .active td,.sidebar .nav-pills>li.active>a,.sidebar  .nav-pills>li.active>a:hover,.sidebar  .nav-pills>li.active>a:focus,.sidebar .sidebar-nav.nav-pills>li.active>a, .sidebar .sidebar-nav.nav-pills>li.active>a:hover, .sidebar .sidebar-nav.nav-pills>li.active>a:focus {background-color: __value__ !important;}',
        'color_left_menu_selected_grades_item'=>'.class-sidebar  a.list-group-item.active .list-group-item-heading,.class-sidebar a.list-group-item.active,.class-sidebar a.list-group-item.active:hover,.class-sidebar a.list-group-item.active:focus {color: __value__ !important;}',
        'color_left_menu_selected_grades_item_background'=>'.class-sidebar a.list-group-item.active,.class-sidebar a.list-group-item.active:hover,.class-sidebar a.list-group-item.active:focus {background-color: __value__ !important;}',
        'color_left_menu_completion_box'=>'.sidebar-checkbox {border-color: __value__ !important}',
        'color_left_menu_completion_box_selected'=>'.active .sidebar-checkbox {border-color: __value__ !important}',
        'color_left_menu_tab'=>'.sidebar .nav-tabs>li>a,.class-sidebar .nav>li>a, .unit-button-inactive a,.course-units-nav .fa-plus, .unit-select .selectize-input {color: __value__;}',
        'color_left_menu_tab_border'=>'.sidebar .nav-tabs>li>a,.class-sidebar .nav>li>a, .unit-button-active .border-helper-left:after, .unit-button-active .border-helper-right:after,.unit-button-inactive a,.unit-select .selectize-input,.unit-button-inactive {border-color: __value__;}',
        'color_left_menu_tab_background'=>'.sidebar .nav-tabs>li>a,.class-sidebar .nav>li>a, .unit-button-active .border-helper-left:after, .unit-button-active .border-helper-right:after,.unit-button-inactive a,.course-units-nav.nav > li > a:hover {background-color: __value__;}',
        'color_left_menu_selected_tab'=>'.sidebar .nav-tabs>li.active>a,.sidebar  .nav-tabs>li.active>a:hover,.sidebar  .nav-tabs>li.active>a:focus,.course-units-nav.nav > li > a:focus,.course-units-nav.nav > li > a:hover,.class-sidebar .nav-pills>li.active>a,.class-sidebar .nav-pills>li.active>a:hover,.class-sidebar .nav-pills>li.active>a:focus,.sidebar-unit-title,.unit-button-active a {color: __value__  !important;}',
        'color_left_menu_selected_tab_background'=>'.sidebar .nav-tabs>li.active>a,.sidebar  .nav-tabs>li.active>a:hover,.sidebar  .nav-tabs>li.active>a:focus,.class-sidebar .nav-pills>li.active>a,.class-sidebar .nav-pills>li.active>a:hover,.class-sidebar .nav-pills>li.active>a:focus,.unit-button-active .border-helper-left:before, .unit-button-active .border-helper-right:before,.unit-button-active,.sidebar-unit-title{background-color: __value__;} .unit-button-active{border: 1px solid __value__;} .unit-button-active a:hover,.course-units-nav.nav > li > a:focus{     background-color: __value__ !important;}',
        'color_right_panels_tab'=>'.admin-group .nav>li>a {color: __value__;}',
        'color_right_panels_tab_background'=>'.admin-group .nav>li>a {background-color: __value__;}',
        'color_right_panels_selected_tab'=>'.admin-group .nav-pills>li.active>a,.admin-group .nav-pills>li.active>a:hover,.admin-group .nav-pills>li.active>a:focus {color: __value__  !important;}',
        'color_right_panels_selected_tab_background'=>'.admin-group .nav-pills>li.active>a,.admin-group .nav-pills>li.active>a:hover,.admin-group .nav-pills>li.active>a:focus {     background-color: __value__ !important;}',
        'color_course_name'=>'.sidebar .course-dropdown .selectize-input:not(.input-active) {color: __value__}',
        'color_topbar_badge'=>'.navbar-inverse .navbar-nav>li.menu-icon > span.new-emails-badge{color: __value__ !important}',
        'color_left_menu_checkmark'=>'.sidebar-checkbox-icon{color: __value__ !important}',
        'color_flashcards_progressbar'=>'#cards .progress-bar{background: __value__ !important}',
        'color_test_dashboard_font'=>'[test-dashboard-summary]  .pagination>.active>a{background: __value__ !important} .test_dashboard_font_color,[test-dashboard-summary] .pagination-total,[test-dashboard-summary]  .pagination>li:not(.disabled):not(.active)>a,.test-dashboard .org-name .selectize-input .item,.test-dashboard .org-name .selectize-input .item:after{color: __value__ !important}',
        'color_test_dashboard_background'=>'[test-dashboard-summary]  .pagination>li:not(.active)>a{background: __value__ !important} [test-dashboard-summary]  .pagination>.active>a{color: __value__ !important}',
        'color_course_arrows'=>'.pager .previous > span, .pager .next > span{color: __value__ !important}',
        'color_btn_post_hover'=>'.btn-post:hover, .btn-post:focus, .btn-post:active{ background-color: __value__ !important}',
        'color_btn_post_background'=>'.btn-post{ background-color: __value__ !important}',
        'color_btn_post_border'=>'.btn-post{ border-color: __value__ !important}',
        'color_nav_progress_circle'=>'no-menu-nav .page-checkmark.checked { color: __value__ !important} .new-progress-bar{background-color: __value__}',
        'color_btn_post'=>'.btn-post{ color: __value__ !important}',
        'color_j1_dashboard_left_text'=>'.j1-text-left,.flat-dashboard-container .classes-container .selectize-input > div{ color: __value__ !important} .flat-dashboard-container .classes-container .selectize-input:after{border-color: __value__ transparent transparent transparent !important;} .flat-dashboard-container .applicants-container li.active{ border-left-color: __value__ !important} .flat-dashboard-container span.student-img {background: __value__}',
        'color_j1_dashboard_left_circle'=>'.flat-dashboard-container .applicants-container li.active{ border-left-color: __value__ !important} .flat-dashboard-container span.student-img {background: __value__}',
        'color_j1_dashboard_right_text'=>'.j1-text-right{ color: __value__ !important} ',
        'color_j1_start_button_border'=>'.j1-start-button{border-color: __value__ !important}',
        'color_j1_start_button_background'=>'.j1-start-button{background-color: __value__}',
        'color_j1_start_button_font_color'=>'.j1-start-button{color: __value__}',
        'color_j1_start_button_border_hover'=>'.j1-start-button:hover{border-color: __value__!important}',
        'color_j1_start_button_background_hover'=>'.j1-start-button:hover{background-color: __value__}',
        'color_j1_start_button_font_color_hover'=>'.j1-start-button:hover{color: __value__}',
        'color_j1_practice_button_border'=>'.j1-practice-button{border-color: __value__ !important}',
        'color_j1_practice_button_background'=>'.j1-practice-button{background-color: __value__}',
        'color_j1_practice_button_font_color'=>'.j1-practice-button{color: __value__}',
        'color_j1_practice_button_border_hover'=>'.j1-practice-button:hover{border-color: __value__ !important}',
        'color_j1_practice_button_background_hover'=>'.j1-practice-button:hover{background-color: __value__}',
        'color_j1_practice_button_font_color_hover'=>'.j1-practice-button:hover{color: __value__}',
        'color_j1_dashboard_right_buttons_color'=>'.btn-container span.fa, .btn-flat.btn-flat-primary, .btn-flat.btn-flat-primary:hover, .btn-flat.btn-flat-primary:focus{color: __value__}',
        'color_j1_dashboard_right_buttons_border'=>'.btn-flat.btn-flat-primary, .btn-flat.btn-flat-primary:hover, .btn-flat.btn-flat-primary:focus{box-shadow: inset 0 0 0 1px __value__}',
        'color_j1_dashboard_right_buttons_background'=>'.btn-flat.btn-flat-primary, .btn-flat.btn-flat-primary:hover, .btn-flat.btn-flat-primary:focus{background-color: __value__}'

    ];
}
?>
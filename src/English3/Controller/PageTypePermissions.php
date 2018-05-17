<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 5/18/17
 * Time: 10:32 AM
 */

namespace English3\Controller;

use PmOrm;

require_once($_SERVER['DOCUMENT_ROOT'].'/controllers/usertools/orm.php');

class PageTypePermissions{

    public $page_types;

    public function __construct(){
        $this->page_types = array(
            'sub_unit'=>                  bindec('00000000000000000001'),
            'content'=>                   bindec('00000000000000000010'),
            'external_link'=>             bindec('00000000000000000100'),
            'vocab'=>                     bindec('00000000000000001000'),
            'quiz'=>                      bindec('00000000000000010000'),
            'quiz_list'=>                 bindec('00000000000000100000'),
            'vocab_quiz'=>                bindec('00000000000001000000'),
            'lesson_listening_activity'=> bindec('00000000000010000000'),
            'listening_practice'=>        bindec('00000000000100000000'),
            'reading_practice'=>          bindec('00000000001000000000'),
            'timed_review'=>              bindec('00000000010000000000'),
            'class_summary'=>             bindec('00000000100000000000'),
            'survey'=>                    bindec('00000001000000000000'),
            'journal'=>                   bindec('00000010000000000000'),
            'welcome'=>                   bindec('00000100000000000000'),
            'glossary'=>                  bindec('00001000000000000000'),
            'scorm'=>                     bindec('00010000000000000000'),
            'forum'=>                     bindec('00100000000000000000'),
            'picture'=>                   bindec('01000000000000000000'),
            'user_info_form'=>            bindec('10000000000000000000')
        );
    }
    public function setPermission($user_id,$page_types){
        global $DB;
        $sql = new \PermissionsSQL();
        $userOrm = new PmOrm($_SESSION,$DB);
        $permission = Bitwise::calculateInt(
            Bitwise::calculateBitwiseValues(array_intersect_key($this->page_types, array_flip($page_types))),
            true);
        return $sql->setPageTypePermissions($permission,$userOrm->my_org(false)['id']);
    }

    public function getPermission($user_id=null){
        global $DB;
        $sql = new \PermissionsSQL();
        $userOrm = new PmOrm($_SESSION,$DB);
        $permissions = intval($sql->getPageTypePermissions($userOrm->my_org(false)['id'])->page_type_permissions);
        return Bitwise::bitToArray($permissions,$this->page_types);
    }
    public function getPermissionForOrg($orgId){
        global $DB;
        $sql = new \PermissionsSQL();
        $permissions = intval($sql->getPageTypePermissions($orgId)->page_type_permissions);
        return Bitwise::bitToArray($permissions,$this->page_types);
    }
}


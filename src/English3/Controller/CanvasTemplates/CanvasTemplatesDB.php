<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.22.8
 * Time: 12:40
 */

namespace English3\Controller\CanvasTemplates;


use English3\Controller\Utility;
use Phinx\Util\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class CanvasTemplatesDB{
    public static function loadAll($filter){
        $query = self::addQueryFilter($filter);
        return Utility::getInstance()->fetch($query,['userId'=>$_SESSION['USER']['ID']]);
    }
    private static function addQueryFilter($filter){
        $q = self::$queryLoadAll;
        $isStudent = false;
        if($_GET["isPrivate"] == "true"){
            $isStudent = true;
        }
        $q = $isStudent ? self::$queryLoadStudents : self::$queryLoadAll;
        foreach($filter as $f){
            $q .= ' and '.$f['id'].'.id = '.$f['value'];
        }

        return $q;
    }
    public static function load($id){
        $data = Utility::getInstance()->fetchRow(self::$queryLoad,['id'=>$id]);
        $fileData = json_decode($data['canvas_json'],true);
        unset($data['canvas_json']);
        $fileData['info'] = $data;
        return $fileData;
    }
    public static function get($id){
        return Utility::getInstance()->fetchRow(self::$queryLoad,['id'=>$id]);
    }
    public static function remove($id){
        Utility::getInstance()->reader->delete('canvas_templates',['id'=>$id]);
    }
    public static function _clone($id){
        $template = self::get($id);
        unset($template['id']);
        $template['canvasJson'] = json_decode($template['canvas_json']);
        $template['name'].=' CLONED';
        self::save($template);
    }
    public static function save($params){
        if($params['id']){
            return self::update($params);
        }else{
            return self::create($params);
        }
    }
    private static function create($params){
        $now = date('Y-m-d H:i:s');
        Utility::getInstance()->reader->insert('canvas_templates',[
           'name'=>$params['name'],
           'classid'=>$params['classid'],
           'created_by'=>$_SESSION['USER']['ID'],
           'modified_by'=>$_SESSION['USER']['ID'],
           'is_private'=>$params['is_private'],
           'canvas_json'=>json_encode($params['canvasJson']),
           'created'=>$now,
           'modified'=>$now,
        ]);
        return Utility::getInstance()->reader->lastInsertId();
    }
    private static function update($params){
        $now = date('Y-m-d H:i:s');
        Utility::getInstance()->reader->update('canvas_templates',[
            'name'=>$params['name'],
            'classid'=>$params['classid'],
            'modified_by'=>$_SESSION['USER']['ID'],
            'is_private'=>$params['is_private'],
            'canvas_json'=>json_encode($params['canvasJson']),
            'modified'=>$now,
        ],['id'=>$params['id']]);
    }
    private static $queryLoadAll = <<<SQL
    select ct.id, ct.name, ct.created_by, ct.modified_by, ct.classid, ct.is_private, ct.created, ct.modified
    from canvas_templates ct
    left join classes class on class.id = ct.classid
    left join courses on courses.id = class.courseid
    left join departments dept on dept.id = courses.departmentid
    left join organizations org on org.id = dept.organizationid
    left join users user on user.id = ct.created_by
    WHERE 1 and (ct.created_by = :userId or ct.is_private <> 1)
SQL;
    private static $queryLoadStudents = <<<SQL
    select ct.id, ct.name, ct.created_by, ct.modified_by, ct.classid, ct.is_private, ct.created, ct.modified
    from canvas_templates ct
    left join classes class on class.id = ct.classid
    left join courses on courses.id = class.courseid
    left join departments dept on dept.id = courses.departmentid
    left join organizations org on org.id = dept.organizationid
    left join users user on user.id = ct.created_by
    WHERE 1 and (ct.modified_by = :userId) and is_private = 1
SQL;
    private static $queryLoad = <<<SQL
    SELECT * FROM canvas_templates where id = :id;
SQL;

}
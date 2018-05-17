<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.12.8
 * Time: 18:21
 */

namespace English3\Controller\ProficiencyTest\ScoreRange;


use English3\Controller\Utility;

class CategoryDB{

    public static function getAll($testId){
        return Utility::getInstance()->fetch("SELECT * FROM score_range_categories where classid = :id",['id'=>$testId]);
    }
    public static function get($catId){
        return Utility::getInstance()->fetchRow("SELECT * FROM score_range_categories where id = :id",['id'=>$catId]);
    }
    public static function save($classId,$name,$id=null){
        if(!$id){
            Utility::getInstance()->insert(self::$querySaveCategory,['classId'=>$classId,'name'=>$name]);
            return Utility::getInstance()->reader->lastInsertId();
        }else{
            Utility::getInstance()->reader->update('score_range_categories',[
                'classId'=>$classId,
                'name'=>$name
            ],['id'=>$id]);
            return $id;
        }


    }
    public static function removeCategory($id){
        Utility::getInstance()->insert(self::$queryRemoveCategory,['id'=>$id]);
    }

    private static $querySaveCategory = <<<SQL
    INSERT INTO score_range_categories (name,classid) VALUES (:name,:classId)
    ON DUPLICATE key UPDATE name = values(name);
SQL;
    private static $queryRemoveCategory = <<<SQL
    DELETE cat,levels FROM
    score_range_categories cat
    LEFT JOIN score_range_levels levels ON levels.categoryid = cat.id
    WHERE cat.id = :id
SQL;


}
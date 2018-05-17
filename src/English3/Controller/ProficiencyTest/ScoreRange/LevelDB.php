<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.11.8
 * Time: 14:51
 */

namespace English3\Controller\ProficiencyTest\ScoreRange;


use English3\Controller\Utility;

class LevelDB{
    public static function getLevels($categoryId){
        $levels = Utility::getInstance()->fetch(self::$queryGetLevels,['id'=>$categoryId]);
        foreach($levels as &$level){
            $level['min']=floatval($level['min']);
            $level['max']=floatval($level['max']);
        }
        return $levels;
    }
    public static function save($catId,$name,$min,$max,$details,$id=null){
        if(!$id){
            Utility::getInstance()->insert(self::$querySaveLevel,[
                'categoryId'=>$catId,
                'name'=>$name,
                'min'=>$min,
                'max'=>$max,
                'details'=>$details
            ]);
            return Utility::getInstance()->reader->lastInsertId();
        }else{
            Utility::getInstance()->reader->update('score_range_levels',[
                'categoryId'=>$catId,
                'name'=>$name,
                'min'=>$min,
                'max'=>$max,
                'details'=>$details
            ],['id'=>$id]);
            return $id;
        }

    }
    public static function removeLevel($id){
        Utility::getInstance()->reader->delete('score_range_levels',['id'=>$id]);
    }
    private static $queryGetLevels= <<<SQL
    SELECT * FROM score_range_levels WHERE categoryid = :id ORDER by min
SQL;
    private static $querySaveLevel= <<<SQL
    INSERT INTO score_range_levels (categoryid,name,min,max,details) VALUES (:categoryId,:name,:min,:max,:details)
    ON DUPLICATE key UPDATE min = values(min),max = values(max),details = values(details);
SQL;
}
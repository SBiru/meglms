<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.28.4
 * Time: 14:31
 */

namespace English3\Controller\Classes;


use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UserClassDuration {
    public function updateClassDuration(Request $request,$userId,$classId){
        Utility::getInstance()->checkTeacher($classId);
        Utility::clearPOSTParams($request);
        $duration = $request->request->get('duration')?:null;
        UserClassDurationDB::updateClassDuration($userId,$classId,$duration);
        return new JsonResponse('ok');
    }
    public function getClassDuration(Request $request,$userId,$classId){
        Utility::getInstance()->checkTeacher($classId);
        return new JsonResponse(['duration'=>UserClassDurationDB::getClassDuration($userId,$classId)]);

    }
    public static function _getClassDuration($userId,$classId){
        return UserClassDurationDB::getClassDuration($userId,$classId);
    }
}
class UserClassDurationDB {
    static function updateClassDuration($userId,$classId,$duration = null){
        Utility::getInstance()->reader->update('user_classes',
            ['course_duration'=>$duration],
            ['userid'=>$userId,'classid'=>$classId]
            );
    }
    static function getClassDuration($userId,$classId){
        return Utility::getInstance()->fetchOne(self::$queryGetClassDuration,['userId'=>$userId,'classId'=>$classId]);
    }
    private static $queryGetClassDuration = <<<SQL
    SELECT if(course_duration,course_duration,course_length)
    FROM user_classes uc
    JOIN classes c on uc.classid = c.id
    WHERE uc.userid = :userId and uc.classid = :classId
SQL;

}
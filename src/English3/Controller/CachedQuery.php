<?php
namespace English3\Controller;

use English3\Controller\Utility;


/*
 * ClassesController::$queryGetAssignmentsAndQuizzes
 * We should trigger the recalculation when changes happen to
 *  -quiz_scores (user score) *
 *  -class_exempted *
 *  -posts and grade_posts
 *  -pages (a page is created/deleted/modified)
 *  -quiz_questions/questions (a new question is added/points changed)
 *  -user_due_date *
 *  -class_assignments
 *  -score_overrides *
*/

class CachedQuery
{
    public static function updateAssingmentAndQuizzesByPage($pageId,$userid){
        $util=new Utility();
        $classId = ClassesController::_getFromPage($util->reader,$pageId);
        $pageInfo = PageController::_get($util->reader,$pageId);
        $unitId = $pageInfo['unit']['id'];
        self::update('assignmentsAndQuizzes',$classId,$unitId,$userid);
    }
    public static function updateAssingmentAndQuizzes($classid,$unitid,$userid){
        self::update('assignmentsAndQuizzes',$classid,$unitid,$userid);
    }
    public static function update($queryId,$classid,$unitid,$userid){
        $util = new Utility();
        $util->insert(self::$queryUpdate,
            [
                'id'=>$queryId,
                'classid'=>$classid,
                'unitid'=>$unitid,
                'userid'=>$userid,
                'last_modified'=>date('Y-m-d h:i:s',(new \DateTime())->getTimestamp())
            ]);
    }

    private static $queryUpdate = <<<SQL
    INSERT INTO cached_queries (query_id, classid, unitid, userid, last_modified)
    VALUES (:id,:classid,:unitid,:userid,:last_modified)
    ON DUPLICATE KEY UPDATE  last_modified = :last_modified

SQL;
}
?>
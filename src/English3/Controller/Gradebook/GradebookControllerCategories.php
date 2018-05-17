<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 4/20/17
 * Time: 12:08 PM
 */

namespace English3\Controller\Gradebook;


use English3\Controller\GradebookController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GradebookControllerCategories extends GradebookController
{
    public function getForUser(Request $request, $userId)
    {
        $util = self::getUtil();
        $util->calcLoggedIn();
        if($userId=='me'){
            $userId=$_SESSION['USER']['ID'];
        }
        return new JsonResponse(self::_getGradebookForUser($userId,@$_REQUEST['classId']));
    }

    private $categoriesSummaryMap  = array();
    public function _getGradebookForUser($userId, $classId = null)
    {
        $student =  parent::_getGradebookForUser($userId, $classId);
        $student['classes'] = array_values($student['classes']);
        $this->getAndMapCategoriesSummary($userId,$classId);
        $this->addCategoriesSummary($student);
        return $student;
    }
    private function addCategoriesSummary(&$student){
        $class = &$student['classes'][0];

        foreach ($class['units'] as &$category){
            $category['max_score']=$this->categoriesSummaryMap[$category['id']]['max_score'];
            $category['actual_score']=$this->categoriesSummaryMap[$category['id']]['actual_score'];
        }
    }
    private function getAndMapCategoriesSummary($userId,$classId){
        $data = Utility::getInstance()->fetch($this->queryGetCategoriesSummary,['userId'=>$userId,'classId'=>$classId]);
        foreach ($data as $row){
            $this->categoriesSummaryMap[$row['categoryid']] = $row;
        }
    }
    private  $queryGetCategoriesSummary = <<<SQL
    SELECT * FROM gradebook_user_categories where userid = :userId and classid = :classId
SQL;

    protected static $queryGetGradebookForUser=<<<SQL
    SELECT gradebook.*,
          gc.id as unitId,
          gc.position as unitPosition,
          gc.name as unitName,
          p.name as pageName,
          p.position as pagePosition,
          p.lesson_duration,
          p.rubricid,
          p.layout,
          cl.name as className,
          cl.id as classId,
          cl.default_exempt_points as defaultExemptPoints,
          pg.id as pGroupId,
          pg.name as pGroupName,
          p.minimum_score_for_completion,
          p.allow_template_post,
          p.allow_text_post,
          p.allow_upload_post,
          p.allow_upload_only_post,
          p.allow_video_post,
          ca.no_due_date,
          su.name as superUnitName,
          su.position as superUnitPosition,
          if(qr.quiz_response_id and (p.can_return <> 1 or qs.is_finished is not null),1,0) as quiz_needing_grade,
          users.organizationid,
          uc.is_suspended,
          CASE WHEN posts.id IS NULL
            THEN false ELSE true
            END AS hasUngradedPost
     FROM
     gradebook
     JOIN pages p ON gradebook.pageid = p.id
     LEFT JOIN pages pg ON p.pagegroupid = pg.id
     LEFT JOIN
        (SELECT id, userid, pageid
         FROM posts
         WHERE id = postrootparentid
            AND id NOT IN (
                SELECT post_reply_id FROM posts
                WHERE NOT id = postrootparentid
            )
         order by posts.id DESC
        ) posts ON posts.pageid = gradebook.pageid AND posts.userid = gradebook.userid
     LEFT JOIN (select * from class_assignments group by page_id) ca ON p.id = ca.page_id
     JOIN units u ON u.id = p.unitid
     JOIN users ON gradebook.userid = users.id
     JOIN classes cl on cl.courseid = u.courseid
     JOIN gradebook_category_pages gp on gp.page_id = p.id
      JOIN gradebook_categories gc on gc.id = gp.category_id
     JOIN user_classes uc on users.id = uc.userid and cl.id = uc.classid
     LEFT JOIN super_units su ON su.id = u.superunitid
     LEFT JOIN quiz_scores qs on qs.user_id = gradebook.userid and qs.quiz_id = p.id
     LEFT JOIN quizzes q on q.id = p.quiz_id
     LEFT JOIN quiz_responses qr on qr.attempt_id = qs.attempt_id and qr.user_id = uc.userid and qr.quiz_id=p.id and qr.is_correct = -1
     WHERE gradebook.userid = :userId and cl.id = :classId
     GROUP BY userid,p.id
     ORDER BY userid,su.position,unitPosition,pagePosition
SQL;
}
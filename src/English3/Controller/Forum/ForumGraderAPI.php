<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 8/29/17
 * Time: 8:41 PM
 */

namespace English3\Controller\Forum;


use English3\Controller\ClassesController;
use English3\Controller\Forum\grader\ForumGraderCalculator;
use English3\Controller\Forum\grader\ForumGraderData;
use English3\Controller\Forum\grader\ForumGraderSQL;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ForumGraderAPI
{
    /**
     * @var ForumGraderSQL
     */
    private $sql;
    public function __construct()
    {
        $this->sql = new ForumGraderSQL();
    }

    public function loadStudentPosts($pageId){
        if(@$_REQUEST['archive']==='true'){
            $rawData = $this->sql->archiveRawData($pageId,@$_REQUEST['studentId'],@$_REQUEST['all']);
        }else{
            $rawData = $this->sql->needingGradeRawData($pageId);
        }
        $forumGrader = new ForumGraderData($rawData);
        return new JsonResponse($forumGrader->toObject());
    }
    public function loadStudentPostsForClass($courseId){
        $classId = ClassesController::_getFromCourseId($courseId);
        $rawData = $this->sql->needingGradeForClassRawData($classId);
        $forumGrader = new ForumGraderData($rawData);
        return new JsonResponse($forumGrader->toObject());
    }


    public function loadUserTopicPosts($topicId,$userId){
        return new JsonResponse($this->sql->userTopicPosts($topicId,$userId,@$_REQUEST['archive']==='true'));
    }
    public function gradePost(Request $request,$postId,$userId){
        Utility::clearPOSTParams($request);
        $forumId = ForumPost::getForumIdFromPostId($postId);
        $calculator = new ForumGraderCalculator($forumId);
        $newAvg = $calculator->gradePost($postId,$userId,$request->request->get('grade'),$request->request->get('message'));
        return new JsonResponse(['avg'=>$newAvg]);
    }
    public function gradeForum(Request $request,$forumId,$userId){
        Utility::clearPOSTParams($request);
        $calculator = new ForumGraderCalculator($forumId);
        $newAvg = $calculator->saveForumAvg($userId,$request->request->get('grade'),$request->request->get('message'));
        return new JsonResponse(['avg'=>$newAvg]);
    }
    public function getStudentGradeInfo($pageId,$studentId){
        $data = $this->sql->studentGrade($pageId,$studentId);
        return $data?:[];
    }
}




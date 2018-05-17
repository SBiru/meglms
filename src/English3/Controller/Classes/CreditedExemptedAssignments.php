<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/1/17
 * Time: 11:49 AM
 */

namespace English3\Controller\Classes;


use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\PageController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CreditedExemptedAssignments {
    public function getExempts(Request $request, $classId, $assignmentId) {
        $this->me = UserController::me(Utility::getInstance()->reader);
        if(!$this->me){
            throw new HttpException(403, 'You must be logged in.');
        }
        if(!$this->me->isTeacher()) {
            throw new HttpException(403, 'You must be a teacher.');
        }
        $isCredited = $request->query->get("credited")=='true';
        $exempt = array(
            'students' => PageController::getExemptStudents(Utility::getInstance()->reader, $assignmentId,$isCredited)
        );
        return new JsonResponse($exempt);
    }

    public function getExemptsForUser(Request $request, $classId, $userId) {
        $util = new Utility();
        $util->checkTeacher($classId);
        $isCredited = $request->query->get("credited")=='true';
        return new JsonResponse(self::_getExemptsForUser($classId,$userId,$isCredited));
    }

    private static function _getExemptsForUser($classId, $userId,$isCredited = false){
        $util = Utility::getInstance();
        $pages = $util->fetch(self::$queryGetExemptPagesForUser,
            [
                'classId'=>$classId,
                'userId'=>$userId,
                'credit'=>$isCredited
            ]
        );
        foreach($pages as &$page){
            if(is_null($page['caId'])){
                $page['caId'] = $page['id'];
            }
            $page['isPageGroup']=boolval($page['page_group']);
            $page['allPages']=boolval($page['all_pages']);
        }
        return $pages;

    }

    public function updateExemptPages(Request $request, $classId,$userId) {
        $util=new Utility();
        $orgId = ClassesController::_getOrgId(Utility::getInstance()->reader,$classId);
        $util->checkTeacher($classId,$orgId);
        Utility::clearPOSTParams($request);
        $pages = $request->request->get('pages');
        $isCredited = $request->request->get("credited")=='true';

        $ids=array();
        foreach($pages as $page){
            $this->exemptPage($page,$userId,$ids,$isCredited);
        }
        // UNEXEMPT
        $alreadyExempt = self::_getExemptsForUser($classId,$userId,$isCredited);
        foreach ($alreadyExempt as $page) {
            if(!in_array($page['id'], $ids)){
                $page['caId']=$page['isPageGroup']?$page['id']:$page['caId'];
                $query = $this->queryUnexemptUser;
                if($page['isPageGroup']){
                    $query.= ' and page_group = 1';
                }
                Utility::getInstance()->execute(
                    $query,
                    array(
                        'userId' => $userId,
                        'caId' => $page['caId'],
                    )
                );
            }
        }
        GradebookController::_recalculate($userId,null,$classId);
        return new JsonResponse(['pages'=>$pages]);
    }

    private function exemptPage($page,$userId,&$ids,$isCredited = false){
        if($page['isPageGroup']){
            foreach($page['pages'] as $child){
                $this->exemptPage($child,$userId,$ids,$isCredited);
            }
            $page['caId']=$page['id'];
        }
        Utility::getInstance()->execute(
            $this->queryExemptUser,
            array(
                'userId' => $userId,
                'caId' => $page['caId'],
                'byUserId' => $_SESSION['USER']['ID'],
                'page_group'=>@$page['isPageGroup'],
                'all_pages'=>@$page['allPages'],
                'comments' => '',
                'is_credited'=>$isCredited
            )
        );
        $ids[] = $page['id'];
    }

    public function updateExempts(Request $request, $classId, $assignmentId) {
        // access permissions
        $this->me = UserController::me(Utility::getInstance()->reader);
        if(!$this->me) {
            throw new HttpException(403, 'You must be logged in.');
        }
        if(!$this->me->isTeacher($classId)) {
            throw new HttpException(403, 'You must be a teacher in this class.');
        }
        Utility::clearPOSTParams($request);
        $students = $request->request->get('students');
        $isCredited = $request->request->get("credited")=='true';
        // EXEMPT
        $ids = array();
        foreach($students as $student){
            Utility::getInstance()->execute(
                $this->queryExemptUser,
                array(
                    'userId' => $student['id'],
                    'caId' => $assignmentId,
                    'byUserId' => $this->me->user->getUserId(),
                    'comments' => '',
                    'all_pages' => null,
                    'page_group' => null,
                    'is_credited' => $isCredited
                )
            );
            $ids[] = $student['id'];
            GradebookController::_recalculate($student['id'],PageController::_getByCaId($assignmentId));
        }
        // UNEXEMPT
        $alreadyExempt = PageController::getExemptStudents(Utility::getInstance()->reader, $assignmentId,$isCredited);
        foreach ($alreadyExempt as $student) {
            $student = json_decode(json_encode($student));
            if(!in_array($student->id, $ids)) {
                Utility::getInstance()->execute(
                    $this->queryUnexemptUser,
                    array(
                        'userId' => $student->id,
                        'caId' => $assignmentId
                    )
                );
                GradebookController::_recalculate($student->id,PageController::_getByCaId($assignmentId));
            }
        }
        return new JsonResponse(array('students' => $students));
    }

    public function exemptUser(Request $request, $classId, $assignmentId, $userId) {
        return $this->exemptOne($request, $classId, $assignmentId, $userId, true);
    }

    public function unexemptUser(Request $request, $classId, $assignmentId, $userId) {
        return $this->exemptOne($request, $classId, $assignmentId, $userId, false);
    }

    private function exemptOne(Request $request, $classId, $assignmentId, $userId, $exempt) {
        Utility::clearPOSTParams($request);
        $isCredited = $request->request->get("credited")=='true';
        $comments = $request->request->get('comments');
        // access permissions
        $this->me = UserController::me(Utility::getInstance()->reader);
        if(!$this->me->isTeacher($classId)) {
            throw new HttpException(403, 'You must be a teacher in this class.');
        }
        $data = Utility::getInstance()->fetch(
            self::$queryGetCaId,
            array(
                ':classId' => $classId,
                ':pageId' => $assignmentId
            )
        );
        if(!$data) {
            $pageLayout=Utility::getInstance()->fetchOne(PageController::$queryGetPage,['pageId'=>$assignmentId],'layout');
            if($pageLayout=='QUIZ'){
                Utility::getInstance()->reader->insert(
                    'class_assignments',
                    array(
                        'class_id'=>$classId,
                        'page_id'=>$assignmentId,
                        'no_due_date'=>1,
                        'points'=>0
                    )
                );
                $caId=Utility::getInstance()->reader->lastInsertId();
            }else{
                throw new HttpException(500, 'Data error. Combination of classId and pageId has no assignment entry in database');
            }
        }
        else{
            $caId=$data[0]['id'];
        }


        $query = $this->queryUnexemptUser;
        $paramsArray = array(
            ':userId' => $userId,
            ':caId' => $caId
        );
        if($exempt){
            $query = $this->queryExemptUser;
            $paramsArray[':byUserId'] = $this->me->user->getUserId();
            $paramsArray[':comments'] = ($comments)? $comments : '';
            $paramsArray[':page_group'] = null;
            $paramsArray[':all_pages'] = null;
            $paramsArray[':is_credited'] = $isCredited;

        }
        $success = Utility::getInstance()->execute($query, $paramsArray);
        if(!$success) {
            throw new HttpException(500, 'Error ocurred while inserting score');
        }
        GradebookController::_recalculate($userId,$assignmentId);
        return(
        ($exempt)?
            new JsonResponse(array(
                'exemptedBy' => $this->me->user->getUserId(),
                'exemptedComments' => $comments
            ))
            :
            'Student removed from exempt list'
        );
    }

    private static $queryGetExemptPagesForUser = <<<SQL
	SELECT p.name,
		   p.id,
		   p.pagegroupid as pageGroupId,
		   ca.id as caId,
			ce.page_group,
            ce.all_pages
	FROM pages p
	LEFT JOIN class_assignments ca on p.id = ca.page_id
	JOIN class_exempted ce on if(ce.page_group=1,ce.caId = p.id,ce.caId = ca.id)
	JOIN units u ON u.id = p.unitid
	JOIN classes cl on cl.courseid = u.courseid
	WHERE cl.id=:classId and ce.userId = :userId and if(:credit,ce.is_credited=1,ce.is_credited=0 or ce.is_credited is null)
	and (ca.id is not null or ce.page_group=1)
	order by u.name,p.position
SQL;
    private $queryExemptUser = <<<SQL
		INSERT INTO class_exempted (userId, caId, byUserId, comments,page_group,all_pages,is_credited)
		VALUES (:userId, :caId, :byUserId, :comments,:page_group,:all_pages,:is_credited)
		ON DUPLICATE KEY UPDATE userId = values(userId),all_pages = values(all_pages), is_credited = values(is_credited)
SQL;

    /* QUERY: exempt user (one) from assignment */
    private $queryUnexemptUser = <<<SQL
		DELETE FROM class_exempted WHERE userId = :userId AND caId = :caId
SQL;
    public static $queryGetCaId = <<<SQL
		SELECT id
		FROM class_assignments
		WHERE class_id = :classId and page_id = :pageId
SQL;
}
<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 17.20.1
 * Time: 16:22
 */

namespace English3\Controller\Grader;


use English3\Controller\ClassesController;
use English3\Controller\Utility;
use React\Stream\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GraderActivitiesForStudent {
    public function needingGrade(Request $request,$courseId,$userId){
        $classId = ClassesController::_getFromCourseId($courseId);
        Utility::getInstance()->checkTeacher($classId);
        list($courseId,$groupId) = GraderActivity::prepareCourseAndGroupId(json_decode(json_encode(['courseId'=>$courseId])));
        $query = MenuQuery::needGradeActivitiesForStudent($classId,$groupId,$userId);
        return new JsonResponse(Utility::getInstance()->fetch($query));
    }
    public function archive(Request $request,$courseId,$userId){
        $classId = ClassesController::_getFromCourseId($courseId);
        Utility::getInstance()->checkTeacher($classId);
        list($courseId,$groupId) = GraderActivity::prepareCourseAndGroupId(json_decode(json_encode(['courseId'=>$courseId])));
        $query = MenuQuery::archiveMenuActivitiesForStudent($courseId,$classId,$groupId,$userId);
        return new JsonResponse(Utility::getInstance()->fetch($query));
    }

}
<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.10
 * Time: 15:41
 */
namespace English3\Controller\Pages;
use English3\Controller\PageController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CourseDescription {
    public function load(Request $request,$id){
        $pageData = Utility::getInstance()->fetchRow($this->queryLoadPage,['pageId'=>$id]);
        $pageData = array_merge($pageData,PageController::_getPageMeta($id));
        $pageData['designer'] = Utility::getInstance()->fetchOne($this->queryGetDesigner,['userId'=>$pageData['designer']]);
        if($pageData['prerequisite']){
            $pageData['prerequisite'] = Utility::getInstance()->fetchOne($this->queryGetPrerequisite,['classId'=>$pageData['prerequisite']]);
        }else{
            $pageData['prerequisite'] = "None";
        }

        return new JsonResponse($pageData);
    }
    private $queryGetDesigner = <<<SQL
    SELECT concat(fname, ' ',lname ) from users where id=:userId
SQL;
    private $queryGetPrerequisite= <<<SQL
    SELECT name from classes where id=:classId
SQL;
    private $queryLoadPage = <<<SQL
    select p.name from pages p where p.id = :pageId;
SQL;

}
<?php
/*
Golabs 21/05/2015
Handler for templates for the 
ckeditor plugin "meglmstemplates"
*/
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class HtmlmeglmsTemplateController
{
    public function __construct(Connection $reader)
    {
        $this->reader = $reader;
    }
    
    private function prepareAndFetch($query, $paramsArray)
    {
        $preparedStatement = $this->reader->prepare($query);
        $preparedStatement->execute($paramsArray);
        return $preparedStatement->fetchAll();
    }
    
    private function prepareAndExecute($query, $paramsArray)
    {
        $preparedStatement = $this->reader->prepare($query);
        if ($preparedStatement === false) {
        trigger_error($this->reader->error, E_USER_ERROR);
        }
        
        $success = $preparedStatement->execute($paramsArray);

        if ($success === false) {
        trigger_error($stmt->error, E_USER_ERROR);
        }

        return  $success;
    }
    
    private function getorgid()
    {
        $data = $this->prepareAndFetch($this->queryGetUserPrivileges, array(
            ':userId' => $_SESSION['USER']['ID']
        ));
        return $data[0]['organizationid'];
    }
    

    public function edithtmltemplates(Request $request)
    {
        $this->me = UserController::me($this->reader);
        
        if (!$this->me->isTeacher()) {
            throw new HttpException(403, 'You must be a teacher.');
        }
        
        
        $content = json_decode($request->getContent());

        $htmltemplate = array(
            'title' => $content->title,
            'description' => $content->description,
            'html' => $content->html,
             'id' => $content->id
        );
        
       $success = $this->prepareAndExecute($this->queryeditHtmlTemplates, $htmltemplate);


        if (!$success) {
            throw new HttpException(500, 'Error ocurred while inserting Template');
        }
        
        $data = json_decode($request->getContent());
        return new JsonResponse(['status'=>'success']);
    }

    public function addhtmltemplate(Request $request)
    {
        $this->me = UserController::me($this->reader);
        
        if (!$this->me->isTeacher()) {
            throw new HttpException(403, 'You must be a teacher.');
        }
        
        
        $content = json_decode($request->getContent());
        if ($content->id>0){
            return $this->edithtmltemplates($request);
        }
          $htmltemplate = array(
            'orgid' => intval($this->getorgid()),
            'title' => $content->title,
            'description' => $content->description,
            'html' => $content->html
        );
        
        $success = $this->prepareAndExecute($this->insertTemplate, $htmltemplate);
        
        if (!$success) {
            throw new HttpException(500, 'Error ocurred while inserting Template');
        }
        
        $data = json_decode($request->getContent());
        return new JsonResponse(['status'=>'success']);
    }
    
    public function getTemplates(Request $request,$orgid)
    {
        $templates = $this->prepareAndFetch($this->queryGetHtmlTemplates, array(
            ':orgid' =>$orgid
        ));
        return new JsonResponse($templates);
    }

        public function deletehtmltemplates(Request $request,$id,$tmpid)
    {

        $templates = $this->prepareAndExecute($this->queryDeleteHtmlTemplates, array(
            ':id' => $tmpid
        ));

        return  $tmpid;
    }
    public function getUserResponse(Request $request,$postId){
        $response = Utility::getInstance()->fetchOne($this->queryUserResponse,['postId'=>$postId]);
        try{
            $response = json_decode($response,true);
            $response['template']=self::_getTemplate($response['template']);
            return new JsonResponse($response);
        }catch(\Exception $e){
            return new JsonResponse(['error'=>"Invalid response"]);
        }
    }
    public static function _getTemplate($id){
        return Utility::getInstance()->fetchRow(self::$queryGetHtmlTemplate,['id'=>$id]);
    }
    
    /* QUERY: insertTemplate */
    private $insertTemplate = <<<SQL
		INSERT INTO html_templates (orgid, title, description, html)
		VALUES (:orgid, :title, :description, :html)
SQL;
    
    public $queryGetUserPrivileges = <<<SQL
		SELECT *
		FROM user_admin_organizations
		WHERE userid = :userId
SQL;
    
    public $queryGetHtmlTemplates = <<<SQL
		SELECT *
		FROM html_templates
		WHERE orgid = :orgid
SQL;
    public static $queryGetHtmlTemplate = <<<SQL
		SELECT *
		FROM html_templates
		WHERE id = :id
SQL;

    public $queryDeleteHtmlTemplates = <<<SQL
        DELETE 
        FROM  html_templates 
        WHERE id = :id
SQL;


    public $queryeditHtmlTemplates = <<<SQL
        UPDATE 
        html_templates 
        set  
        title = :title,
        description = :description,
        html = :html
        where id= :id
SQL;
    public $queryUserResponse = <<<SQL
      SELECT message FROM posts WHERE id = :postId
SQL;



}
?>
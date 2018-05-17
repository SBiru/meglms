<?php

namespace English3\Controller\Glossary\Import;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GlossaryImport
{
    /**
     * @var GlossaryImportDB
     */
    private $db ;
    public function __construct(){
        $this->db = new GlossaryImportDB();
    }
    public function uploadFile(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkRequiredFields(['orgId'],$request->request->all(),true);
        $originalFile = $request->files->get('file');
        $parser = new GlossaryXMLParser($originalFile);
        $id = $this->db->uploadFile($request->request->get('orgId'),$originalFile,$parser->parse());
        return new JsonResponse($this->db->getPreviousFile($id));
    }
    public function getPreviousUploads(Request $request){
        Utility::getInstance()->calcLoggedIn();
        Utility::getInstance()->checkRequiredFields(['orgId'],$request->query->all(),true);
        return new JsonResponse($this->db->getPreviousUploads($request->get('orgId')));
    }
    public function removeUploadedFile(Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        $this->db->removeUploadedFile($id);
        return new JsonResponse('ok');
    }
    public function import(Request $request,$id){
        Utility::getInstance()->calcLoggedIn();
        Utility::clearPOSTParams($request);
        $this->db->import($id,$request->request->get('tags'));
        return new JsonResponse('ok');
    }
}
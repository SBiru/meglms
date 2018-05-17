<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.22.8
 * Time: 12:40
 */

namespace English3\Controller\CanvasTemplates;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CanvasTemplates {
    public function save(Request $request){
        Utility::clearPOSTParams($request);
        $id = CanvasTemplatesDB::save($request->request->all());
        return new JsonResponse(['id'=>$id]);
    }
    public function loadAll(Request $request = null){
        $filter = [];
        if($request && $request->query->get('filter')){
            $filter = json_decode($request->query->get('filter'),true);
        }
        return new JsonResponse(CanvasTemplatesDB::loadAll($filter));
    }
    public function load(Request $r, $id){
        $data = CanvasTemplatesDB::load($id);
        return new JsonResponse($data);
    }
    public function loadProperties(Request $r, $id){
        $data = CanvasTemplatesDB::load($id);
        $properties = $data['properties'];
        $properties['loaded'] = true;
        return new JsonResponse($properties);
    }
    public function remove(Request $r,$id){
        CanvasTemplatesDB::remove($id);
        return new JsonResponse('ok');
    }
    public function _clone(Request $r,$id){
        CanvasTemplatesDB::_clone($id);
        return new JsonResponse('ok');
    }
    public function getUserResponse(Request $r, $postId){
        $response = Utility::getInstance()->fetchOne($this->queryUserResponse,['postId'=>$postId]);
        try{
            $response = json_decode($response,true);
            return new JsonResponse($response);
        }catch(\Exception $e){
            return new JsonResponse(['error'=>"Invalid response"]);
        }
    }
    public $queryUserResponse = <<<SQL
      SELECT message FROM posts WHERE id = :postId
SQL;

}

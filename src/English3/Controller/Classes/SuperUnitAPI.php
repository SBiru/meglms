<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.4
 * Time: 13:56
 */

namespace English3\Controller\Classes;


use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class SuperUnitAPI {
    public function __construct(){

    }
    public function get(Request $request,$id){
        $unit = SuperUnitDB::fromId($id);
        $unit->prepareForDisplay();

        return new JsonResponse($unit->data);
    }
    public function create(Request $request){
        $unit = new SuperUnitDB([]);
        return $this->save($request,$unit);
    }
    private function save(Request $request,SuperUnitDB $unit){
        Utility::clearPOSTParams($request);
        try{
            $unit->save($request->request->all());
        }catch(SuperUnitException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }

        $unit->prepareForDisplay();

        return new JsonResponse($unit->data);
    }
    public function update(Request $request,$id){
        $unit = SuperUnitDB::fromId($id);
        return $this->save($request,$unit);
    }
    public function delete(Request $request, $id){
        $unit = SuperUnitDB::fromId($id);
        $unit->delete();
        return new JsonResponse('ok');
    }

}
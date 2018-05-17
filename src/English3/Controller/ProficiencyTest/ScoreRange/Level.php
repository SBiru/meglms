<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.11.8
 * Time: 14:47
 */

namespace English3\Controller\ProficiencyTest\ScoreRange;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class Level {
    public function remove(Request $request,$id){
        LevelDB::removeLevel($id);
        return new JsonResponse("ok");
    }
    public function save(Request $request,$categoryId){
        Utility::clearPOSTParams($request);
        $id = LevelDB::save(
            $categoryId,
            $request->request->get('name'),
            $request->request->get('min'),
            $request->request->get('max'),
            $request->request->get('details'),
            $request->request->get('id')
        );
        return new JsonResponse(['id'=>$id]);
    }
}

<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.10.8
 * Time: 16:37
 */

namespace English3\Controller\ProficiencyTest\ScoreRange;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class Category {
    public function getAll(Request $request,$testId){
        $categories = CategoryDB::getAll($testId);
        if($request->query->get('includeLevels')){
            foreach($categories as &$cat){
                $cat['ranges']=LevelDB::getLevels($cat['id']);
            }
        }
        return new JsonResponse($categories);
    }
    public function save(Request $request,$testId){
        Utility::clearPOSTParams($request);
        $name = $request->request->get('name');
        $id = $request->request->get('id');
        $id = CategoryDB::save($testId,$name,$id);
        return new JsonResponse(['id'=>$id]);
    }
    public function remove(Request $request,$id){
        CategoryDB::removeCategory($id);
        return new JsonResponse("ok");
    }
}

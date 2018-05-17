<?php
namespace English3\Controller\Gradebook;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GradebookCategories {
    public function load(Request $request, $classId){
        $categories = $this->getAndPrepareCategories($classId);
        return new JsonResponse($categories);
    }
    public function getAndPrepareCategories($classId,$addDefaultCategory=false){
        $rawData = Utility::getInstance()->fetch($this->queryLoadCategoriesForClass,['classId'=>$classId]);
        $categories = $this->prepareCategories($rawData);
        if($addDefaultCategory){
            $this->addCourseCategoryAndSort($categories);
        }
        return $categories;
    }
    public function addCourseCategoryAndSort(&$categories){
        Utility::sortBy($categories,'name');
        array_unshift($categories,['id'=>null,'name'=>'Course']);
    }
    private function prepareCategories($rawData){
        $categories = [];
        foreach($rawData as $row){
            Utility::addToObjectIfNotExists($row['id'],[
                'id'=>$row['id'],
                'name'=>$row['name'],
                'points'=>$row['points'],
                'assignments'=>[]
            ],$categories);
            if($row['page_id']){
                Utility::addToArrayIfNotExists($row['page_id'],$categories[$row['category_id']]['assignments']);
            }
        }
        return array_values($categories);
    }
    public function save(Request $request, $classId){
        Utility::getInstance()->checkTeacher($classId);

        Utility::clearPOSTParams($request);

        $this->clearCategoriesForClass($classId);
        $this->saveCategories($request->request->get('categories'),$classId);

        return new JsonResponse('ok');
    }
    private function clearCategoriesForClass($classId){
        Utility::getInstance()->insert($this->queryClearCategoriesForClass,['classId'=>$classId]);
    }
    private function saveCategories($categories,$classId){
        foreach ($categories as $i=>$category) {
            $categoryId = $this->createNewCategory($category,$classId,$i);
            $this->saveCategoryPages($categoryId,$category['assignments']);
        }

    }
    private function createNewCategory($category,$classId,$i){
        Utility::getInstance()->reader->insert('gradebook_categories',[
            'class_id'=>$classId,
            'name'=>$category['name'],
            'points'=>$category['points'],
            'position'=>$i
        ]);
        return Utility::getInstance()->reader->lastInsertId();
    }
    private function saveCategoryPages($categoryId,$pages){
        foreach($pages as $i=>$pageId){
            Utility::getInstance()->reader->insert('gradebook_category_pages',[
                'page_id'=>$pageId,
                'category_id'=>$categoryId,
                'position'=>$i
            ]);
        }
    }
    private function clearCategoryPage($pageId){
        Utility::getInstance()->reader->delete('gradebook_category_pages',['page_id'=>$pageId]);
    }

    public function updateCategoryPage($pageId,$categoryId=null){
        $this->clearCategoryPage($pageId);
        if($categoryId){
            $this->saveCategoryPages($categoryId,[$pageId]);
        }
    }
    public static function hasCategories($classId){
        return boolval(Utility::getInstance()->fetchOne(self::$queryHasCategories,['classId'=>$classId]));
    }
    private $queryLoadCategoriesForClass = <<<SQL
    select *
    from gradebook_categories c
    left join gradebook_category_pages cp on cp.category_id = c.id
    where c.class_id = :classId order by c.position,cp.position
SQL;
    private $queryClearCategoriesForClass = <<<SQL
    delete c,cp
    from gradebook_categories c
    left join gradebook_category_pages cp on cp.category_id = c.id
    where c.class_id = :classId
SQL;
    private static $queryHasCategories = <<<SQL
    select c.id
    from gradebook_categories c
    where c.class_id = :classId limit 1
SQL;
}
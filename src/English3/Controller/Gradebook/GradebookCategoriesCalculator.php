<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 17.2.2
 * Time: 19:59
 */

namespace English3\Controller\Gradebook;


use English3\Controller\Utility;

class GradebookCategoriesCalculator {

    protected $categoriesMapper;
    protected $rootCategory;
    protected $aggregatedGradeIncludingNonDue;
    protected $aggregatedGrade;
    protected $aggregatedCompletedGrade;
    protected $totalScore;
    protected $completedScore;
    protected $totalScoreIncludingNonDue;
    protected $totalMaxScore;
    protected $totalWorkedScore;
    protected $totalCompletedOrDueScore;
    protected $classId;
    protected $userId;
    public function __construct($units,$classId,$userId){
        $this->categoriesMapper = new CategoriesMapper($units,$classId);
        $this->classId = $classId;
        $this->userId = $userId;
    }
    public function calculate(){
        $this->rootCategory = $this->categoriesMapper->mapCategories();
        $this->aggregatedGrade = $this->aggregateGrades($this->rootCategory, time(),false);
        $this->aggregatedCompletedGrade = $this->aggregateGrades($this->rootCategory, time(),false,true);
        $this->aggregatedGradeIncludingNonDue = $this->aggregateGrades($this->rootCategory, time(),true);
        return $this->aggregatedGrade;
    }
    public function getAggregatedGrade(){
        return $this->aggregatedGrade;
    }
    public function getAggregatedGradeIncludingNonDue(){
        return $this->aggregatedGradeIncludingNonDue;
    }
    private function aggregateGrades(&$items,$today,$includeNonDue,$onlyCompleted=false,$root=true){
        $denominator = 0;
        $numerator = 0;
        foreach($items as &$item){
            if(array_key_exists('items',$item)){
                $score = $this->aggregateGrades($item['items'],$today,$includeNonDue,$onlyCompleted,false);
                $item['score'] = $score===null?null:$item['maxScore'] * $score;
                if($includeNonDue && !$onlyCompleted){
                    $item['percScore'] = $score;
                }
            }
            if(boolval(@$item['exemptedBy']) && !boolval(@$item['isCredited'])){
                continue;
            }
            if($item['score']!==null){
                $denominator += $item['maxScore'];
                $numerator += $item['score'];
            }else if(!$onlyCompleted && ($includeNonDue || (@$item['due_date'] && $today> (new \DateTime($item['due_date']))->getTimestamp()))){
                $denominator += $item['maxScore'];
            }
        }
        if($root){

            if($includeNonDue){
                $this->totalScoreIncludingNonDue = $numerator;
                $this->totalMaxScore = $denominator;
            }else{
                if($onlyCompleted){
                    $this->completedScore = $numerator;
                    $this->totalWorkedScore = $denominator;
                }else{
                    $this->totalScore = $numerator;
                    $this->totalCompletedOrDueScore = $denominator;
                }
            }
        }
        return $denominator ? $numerator / $denominator : null;
    }
    public function updateClassSummary(&$classSummary){
        $classSummary['percentCompletedOrDueScore'] = round($this->aggregatedGrade*100,2);
        $classSummary['percentPartial'] = round($this->aggregatedCompletedGrade*100,2);
        $classSummary['percentComplete'] = round($this->aggregatedGradeIncludingNonDue*100,2);
        $classSummary['totalScore'] = round($this->totalScore,2);
        $classSummary['completedScore'] = round($this->completedScore,2);
        $classSummary['totalScoreIncludingNonDue'] = round($this->totalScoreIncludingNonDue,2);
        $classSummary['totalMaxScore'] = round($this->totalMaxScore,2);
        $classSummary['totalWorkedScore'] = round($this->totalWorkedScore,2);
        $classSummary['totalCompletedOrDueScore'] = round($this->totalCompletedOrDueScore,2);
    }
    public function save(){
        $this->clearDB();
        foreach ($this->rootCategory as $item){
            if(array_key_exists('isCategory',$item) && $item['isCategory']){
                $this->saveEntry($item);
            }
        }
    }
    protected function saveEntry($item){
        Utility::getInstance()->reader->insert('gradebook_user_categories',[
            'userid'=>$this->userId,
            'classid'=>$this->classId,
            'categoryid'=>$item['id'],
            'max_score'=>$item['maxScore'],
            'actual_score'=>round($item['maxScore'] * ($item['percScore']?:0),2)
        ]);
    }

    protected function clearDB(){
        Utility::getInstance()->reader->delete('gradebook_user_categories',[
            'userid'=>$this->userId,
            'classid'=>$this->classId
        ]);
    }

}


class CategoriesMapper{
    protected $units;
    protected $classId;
    protected $categoriesCtrl;
    protected $rootCategory;
    protected $pageCategoryIndexes = [];
    protected $categories;
    public function __construct($units,$classId){
        $this->units = $units;
        $this->classId = $classId;
        $this->categoriesCtrl = new GradebookCategories();
    }
    public function mapCategories(){
        $this->categories = $this->categoriesCtrl->getAndPrepareCategories($this->classId);
        $this->assignPagesToCategories();
        return $this->rootCategory;
    }
    private function assignPagesToCategories(){
        $this->addCategoriesToRoot();
        $this->addPagesToRootOrCategory();
    }
    private function addCategoriesToRoot(){
        foreach($this->categories as $cat){
            if(count($cat['assignments'])){
                $cat['items']=[];
                $cat['isCategory'] = true;
                $cat['maxScore'] = $cat['points'];
                $cat['score'] = null;
                $this->rootCategory[]=$cat;
                $this->preparePageCategoryIndexes($cat['assignments'],count($this->rootCategory)-1);
            }
        }
    }
    private function preparePageCategoryIndexes($pages,$i){
        foreach($pages as $pageId){
            $this->pageCategoryIndexes[$pageId]=$i;
        }
    }
    private function addPagesToRootOrCategory(){
        foreach($this->units as $unit){
            foreach($unit['pagegroups'] as $pageGroup) {
                foreach ($pageGroup['pages'] as $page) {
                    $this->addPageToRootOrCategory($page);
                }
            }
        }
    }
    private function addPageToRootOrCategory($page){
        $page['score']=@($page['scoreOverride']!==null && !$page['overrideDeleted']?$page['scoreOverride']:$page['score']);
        if(($categoryIndex = $this->getPageCategoryIndex($page['id']))!== false){
            $category = &$this->rootCategory[$categoryIndex];
            $category['items'][]=$page;
        }else{
            $this->rootCategory[]=$page;
        }
    }
    private function getPageCategoryIndex($pageId){
        if(array_key_exists($pageId,$this->pageCategoryIndexes)){
            return $this->pageCategoryIndexes[$pageId];
        }
        return false;
    }
}

<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/9/17
 * Time: 3:20 PM
 */

namespace English3\Controller\Classes;

use English3\Controller\Utility;

class NoMenuClass {
    private $units;
    private $currentPage;
    public static function isNoMenu($courseId){
        return boolval(Utility::getInstance()->fetchOne(self::$queryIsNoMenu,['id'=>$courseId]));
    }

    public static function initWithUnits($units){
        $self = new self();
        $self->units = $units;
        return $self;
    }

    public function findCurrentActivity(){
        foreach($this->units as $i=>$unit){
            foreach($unit->pages as $j=>$page){
                if(!$this->isPageCompleted($page)){
                    $this->currentPage = ['unit'=>$i,'page'=>$j];
                    return $this->currentPage;
                }
            }
        }
        return ['unit'=>-1,'page'=>-1];
    }
    private function isPageCompleted($page){
        if($page->isExempt){
            return true;
        }
        return call_user_func(array('\English3\Controller\Classes\PageCompletedChecker', $page->layout), $page);
    }
    public function isLastPage(){
        $unitIndex = $this->currentPage['unit'];
        $pageIndex = $this->currentPage['page'];
        return $unitIndex == -1 || (
               $unitIndex == count($this->units)-1 &&
               $pageIndex == count($this->units[$unitIndex]->pages) -1
           );
    }



    private static $queryIsNoMenu = <<<SQL
    SELECT meta_value FROM class_meta WHERE meta_key = 'no_menu' and classid = :id
SQL;

}
class PageCompletedChecker
{
    public static function header($page){
        return true;
    }
    public static function content($page){
        return $page->isSubmitted || $page->isGraded;
    }
    public static function user_info_form($page){
        return $page->isSubmitted || $page->isGraded;
    }
    public static function welcome($page){
        return $page->isSubmitted || $page->isGraded;
    }
    public static function timed_review($page){
        return self::content($page) || $page->number_of_attempts>0;
    }
    public static function quiz($page){
        return $page->quizFinished;
    }

    public static function picture($page){
        return $page->isSubmitted || $page->isGraded;
    }

}
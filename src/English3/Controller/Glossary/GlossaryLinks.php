<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 5/15/17
 * Time: 4:47 PM
 */

namespace English3\Controller\Glossary;


use English3\Controller\ClassesController;
use English3\Controller\Utility;

class GlossaryLinks
{
    private $classId;
    private $words = [];
    private $wordIndex = [];
    public function __construct($classId)
    {
        $this->classId = $classId;
    }
    public function loadWords(){
        $pages = $this->getGlossaryPages();
        foreach ($pages as $pageId){
            $glossary = new Glossary($pageId);
            $this->words = array_merge($this->words, $glossary->getWords(1000000)->data);
        }


    }
    private function getGlossaryPages(){
        return Utility::mapIds(Utility::getInstance()->fetch(Glossary::$queryGetGlossaryPagesForClass,
            ['classId'=>$this->classId]));
    }
    public function processText($text)
    {
        if(!count($this->words)) $this->loadWords();
        if(!count($this->words)) return $text;
        $text = preg_replace('/&nbsp;/',' ',$text);
        return preg_replace_callback($this->preparePatterns(),function($matches){
            $word = $matches[2];
            $id = $this->wordIndex[strtolower($word)];
            return $matches[1]." <span glossary-word='$id'>$word</span> ".$matches[3];
        },$text);
    }
    private function preparePatterns(){
        $words = array_map(function($w){
            $this->wordIndex[strtolower($w['word'])] = $w['id'];
            return $w['word'];
        },$this->words);
        return "/(^|\s|&nbsp;|\n|\r|>)?(".implode("|",$words).")($|\s|&nbsp;|<)/i";
    }

    public static function processIfNeeded($classId,$text){
        $instance = new self($classId);
        return $instance->processText($text);
    }
    public static function processIfNeededUsingPageId($pageId,$text){
        $instance = new self(ClassesController::_getFromPage(null,$pageId));
        return $instance->processText($text);
    }
    private $queryGetGlossaryPagesForClass = <<<SQL
    SELECT p.id FROM pages p
    JOIN units u on p.unitid = u.id
    JOIN classes c on c.courseid = u.courseid
    where c.id = :classId and p.layout = 'GLOSSARY'
SQL;
}
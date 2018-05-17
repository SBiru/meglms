<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 8/18/17
 * Time: 10:11 AM
 */

namespace English3\Controller\Forum;


use English3\Controller\Utility;

class ForumHTMLExporter
{
    private $topicId;
    public function __construct($topicId){
        $this->topicId = $topicId;
    }
    public function export(){
        $tree = ForumTopic::loadTopic($this->topicId,true);
        $treeHTML = $this->createTopicsHTML($tree);
        $fileName = preg_replace('/([^.a-z0-9]+)/i', '_', $tree['title']).'-'.date('Ymd-hia').".html";
        return Utility::buildFileResponse($this->createBody($treeHTML),$fileName);

    }
    private function createTopicsHTML($topic){
        $box = $this->getTemplateWithParams(realpath(dirname(__FILE__)). '/exporterTemplates/topic-box.php',
            $topic);
        if(!$topic['title']){
            $box = str_replace('<span id="by">by </span>','',$box);
        }
        if(count($topic['children'])){
            $children = '';
            $i = 0;
            foreach ($topic['children'] as $child){
                $childBox = $this->createTopicsHTML($child);
                if($i==count($topic['children'])-1){
                    $children .= '<div class="threading" style="border-left-color: transparent;">'. $childBox .'</div>';
                }else{
                    $children .= '<div class="threading">'. $childBox .'</div>';
                }
                $i++;            }
            $box.= $children;
        }

        return $box;
    }
    private function getTemplateWithParams($template,$params=[]){
        ob_start();
        include($template);
        $template = ob_get_contents();
        ob_end_clean();
        foreach ($params as $key=>$value){
            $template = str_replace("%".$key."%",$value,$template);
        }
        return $template;
    }
    private function createBody($topicsHTML){
        return $this->getTemplateWithParams(realpath(dirname(__FILE__)). '/exporterTemplates/body.php',
            [
                'html_title'=>'Topic Discussion',
                'body'=>$topicsHTML
            ]);
    }

}
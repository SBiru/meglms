<?php
namespace English3\Controller\Posts;

class SiblingServerFinder {
    public static function addSiblingDomainIfNeeded(&$contentUrl){
        global $LOCAL_CONFIG,$PATHS;
        if(!(isset($LOCAL_CONFIG) && $LOCAL_CONFIG->siblingServer)){
            return;
        }
        if($contentUrl && !file_exists($PATHS->app_path.$contentUrl) && $contentUrl!='audioOnly'){
            $contentUrl = $LOCAL_CONFIG->siblingServer.$contentUrl;
        }
    }
    public static function addDomainToPostIfNeeded(&$post){
        self::addSiblingDomainIfNeeded($post['video_url']);
        self::addSiblingDomainIfNeeded($post['video_thumbnail_url']);
        self::addSiblingDomainIfNeeded($post['upload_url']);
        self::addSiblingDomainIfNeeded($post['upload_file_name']);
    }
    public static function checkIfThumbnailExists(&$post){
        global $PATHS;
        if($post['video_url'] && file_exists($PATHS->app_path.$post['video_url']) && $post['video_thumbnail_url'] && !file_exists($PATHS->app_path.$post['video_thumbnail_url'])){
            $post['video_thumbnail_url'] = 'audioOnly';
        }
    }
    public static function checkIfThumbnailExists_stdClass(&$post){
        global $PATHS;
        if($post->video_url && file_exists($PATHS->app_path.$post->video_url) && $post->video_thumbnail_url && !file_exists($PATHS->app_path.$post->video_thumbnail_url)){
            $post->video_thumbnail_url = 'audioOnly';
        }
    }

}
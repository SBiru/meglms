<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.22.7
 * Time: 13:00
 */

namespace English3\Util;


class CustomDomain {
    public static function favicon(){ return self::getFeatureForDomain('favicon');}
    public static function pageTitle(){ return self::getFeatureForDomain('title'); }
    public static function getSignInHtml(){ return self::getFeatureForDomain('signin'); }

    private static function getFeatureForDomain($feature){
        $domain = self::currentHost();
        if(!self::$fileLoaded && $conf = self::loadConf()){

            self::$customDomainFeatures = array_merge_recursive(self::$customDomainFeatures,$conf);
            self::$fileLoaded = true;
        }
        if(isset(self::$customDomainFeatures[$domain]) && self::$customDomainFeatures[$domain][$feature]){
            return self::$customDomainFeatures[$domain][$feature];
        }
        return self::$customDomainFeatures['default'][$feature];
    }
    private static function currentHost(){
        return $_SERVER['HTTP_HOST'];
    }
    private static function loadConf(){
        global $PATHS;
        $domainsJsonFile = $PATHS->app_path . '/domains.json';
        if(file_exists($domainsJsonFile)){
            try{
                return json_decode(file_get_contents($domainsJsonFile),true);
            }catch(\Exception $exception){
                return null;
            }
        }
        return null;
    }
    public static function loadCurrentConf(){
        $domain = self::currentHost();
        if(isset(self::$customDomainFeatures[$domain])){
            return self::$customDomainFeatures[$domain];
        }
        return [''=>''];
    }
    public static $customDomainFeatures = [
      'myedkey.org'=>[
          'favicon'=>'/edkey-favicon.ico?v=2',
          'title'=>'ELMS Platform',
      ],
        'dev.meglms.com'=>[
            'favicon'=>'/edkey-favicon.ico?v=2',
            'title'=>'ELMS Platform',
        ],
      'default'=>[
          'favicon'=>'/favicon.ico?v=2',
          'title'=>'E3 ELL Platform',
          'signin'=>'signin.html'
      ]
    ];
    private static $fileLoaded = false;
}
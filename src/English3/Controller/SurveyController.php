<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SurveyController {

    public function __construct(Connection $reader=null) {

    }
    public static function _get(Connection $reader,$page_id){
        $util = new Utility($reader);
        return $util->fetchRow(self::$queryGetSurvey,['pageId'=>$page_id]);
    }
    public static function _finalize(Connection $reader,$page_id){
        $util = new Utility($reader);
        $util->calcLoggedIn();
        $user_id = $util->me->user->getUserId();
        $class_id = $util->fetchOne(CloneController::$queryGetClassFromPage,['pageId'=>$page_id],'id');

        $survey = self::_get($reader,$page_id);

        if(!$survey){
            throw new HttpException(400, 'Could not find survey');
        }
        $previousScore = $util->fetchOne(self::$queryGetQuizScore,['userId'=>$user_id,'pageId'=>$page_id]);

        if($previousScore){
            $reader->update('quiz_scores',
                array(
                    'score'=>intval($survey['survey_points']),
                    'is_finished'=>1,
                    'max_points'=>intval($survey['survey_points']),
                    'class_id'=>$class_id
                ),
                array(
                    'user_id'=>$user_id,
                    'quiz_id'=>$page_id
                )
            );
        }else{
            $reader->insert('quiz_scores',
                array(
                    'score'=>$survey['survey_points'],
                    'is_finished'=>1,
                    'submitted'=>'CURRENT_TIMESTAMP()',
                    'attempts_completed'=>1,
                    'max_points'=>$survey['survey_points'],
                    'class_id'=>$class_id,
                    'user_id'=>$user_id,
                    'quiz_id'=>$page_id
                )
            );
        }
        GradebookController::_recalculate($user_id,$page_id);
    }

    private static $queryGetSurvey = <<<SQL
      SELECT pages.id,pages.survey_points FROM pages
      JOIN quizzes on pages.quiz_id = quizzes.id
      WHERE pages.id = :pageId and quizzes.is_survey = 1
SQL;
    private static $queryGetQuizScore = <<<SQL
      SELECT id FROM quiz_scores
      WHERE user_id = :userId and quiz_id = :pageId
SQL;


}
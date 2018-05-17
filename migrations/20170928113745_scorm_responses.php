<?php

use Phinx\Migration\AbstractMigration;

class ScormResponses extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $sql = <<<SQL
			CREATE TABLE IF NOT EXISTS `scorm_responses`( `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `scorm_registeration_id` varchar(50) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `satisfied` tinyint(1) DEFAULT '0',
  `completed` tinyint(1) DEFAULT '0',
  `progress_status` tinyint(1) DEFAULT '0',
  `attempt_progress_status` tinyint(1) DEFAULT '0',
  `attempts` tinyint(3) DEFAULT '0',
  `suspended` tinyint(1) DEFAULT '0',
  `completion_status` varchar(20) DEFAULT NULL,
  `credit` varchar(20) DEFAULT NULL,
  `entry` varchar(20) DEFAULT NULL,
  `exit` varchar(20) DEFAULT NULL,
  `audio_level` DOUBLE DEFAULT '0',
  `language` varchar(20) DEFAULT NULL,
  `delivery_speed` DOUBLE DEFAULT '0',
  `audio_captioning` DOUBLE DEFAULT '0',
  `location` varchar(20) DEFAULT NULL,
  `mode` varchar(20) DEFAULT NULL,
  `progress_measure` DOUBLE DEFAULT '0',
  `score_scaled` DOUBLE DEFAULT '0',
  `score_raw` DOUBLE DEFAULT '0',
  `score_min` DOUBLE DEFAULT '0',
  `score_max` DOUBLE DEFAULT '0',
  `total_time` varchar(20) DEFAULT NULL,
  `time_tracked` varchar(20) DEFAULT NULL,
  `success_status` varchar(20) DEFAULT NULL,
  `suspend_data` varchar(200) DEFAULT NULL,
  `comments_from_learner` varchar(20) DEFAULT NULL,
  `comments_from_lms` varchar(20) DEFAULT NULL,
  `objectives` varchar(20) DEFAULT NULL,
  `completion_threshold` varchar(20) DEFAULT NULL,
  `launch_data` varchar(20) DEFAULT NULL,
  `learner_id` varchar(20) DEFAULT NULL,
  `learner_name` varchar(20) DEFAULT NULL,
  `max_time_allowed` varchar(20) DEFAULT NULL,
  `scaled_passing_score` varchar(20) DEFAULT NULL,
  `time_limit_action` varchar(20) DEFAULT NULL,
  `children` varchar(20) DEFAULT NULL,
  `interactions` text,
  `scorm_response` text,
  PRIMARY KEY (`id`) ); 
			
SQL;
        $this->execute($sql);
    }
}

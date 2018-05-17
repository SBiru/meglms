<?php

use Phinx\Migration\AbstractMigration;

class CreateUserClassesHistory extends AbstractMigration
{
    /**
     * Change Method.
     *
     * More information on this method is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-change-method
     *
     * Uncomment this method if you would like to use it.
     *
    public function change()
    {
    }
    */
    
    /**
     * Migrate Up.
     */
    public function up()
    {
    $sql = <<<SQl
    CREATE TABLE IF NOT EXISTS `user_classes_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userid` int(10) unsigned NOT NULL,
  `classid` int(10) unsigned NOT NULL,
  `is_student` tinyint(1) NOT NULL DEFAULT '0',
  `is_teacher` tinyint(1) NOT NULL DEFAULT '0',
  `is_edit_teacher` tinyint(1) NOT NULL DEFAULT '0',
  `is_observer` tinyint(1) NOT NULL DEFAULT '0',
  `is_suspended` tinyint(1) NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `groupid` int(11) DEFAULT NULL,
  `finished_the_class` tinyint(1) DEFAULT NULL,
  `final_score` varchar(10) DEFAULT NULL,
  `finalizedBy` int(11) DEFAULT NULL,
  `finalizedOn` timestamp NULL DEFAULT NULL,
  `finalizedComments` varchar(255) DEFAULT NULL,
  `recalculate_due_dates` int(11) DEFAULT '0',
  `recalculate_gradebook` int(11) DEFAULT '0',
  `date_left` date DEFAULT NULL,
  `course_duration` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`userid`,`classid`,`created`,`is_student`),
  UNIQUE KEY `userid` (`userid`,`classid`,`groupid`),
  KEY `is_teacher` (`is_teacher`)
);
SQl;
    $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}
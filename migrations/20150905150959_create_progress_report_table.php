<?php

use Phinx\Migration\AbstractMigration;

class CreateProgressReportTable extends AbstractMigration
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
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS `progress_report` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `classid` int(11) NOT NULL,
  `total_tasks` int(11) DEFAULT NULL,
  `completed_tasks` int(11) DEFAULT NULL,
  `expected_tasks` int(11) DEFAULT NULL,
  `perc_completed_tasks` int(11) DEFAULT NULL,
  `perc_expected_tasks` int(11) DEFAULT NULL,
  `total_score` double DEFAULT NULL,
  `total_max_score` double DEFAULT NULL,
  `total_worked_score` double DEFAULT NULL,
  `letter_completed_score` varchar(3) DEFAULT NULL,
  `perc_completed_score` double DEFAULT NULL,
  `letter_total_score` varchar(3) DEFAULT NULL,
  `perc_total_score` double DEFAULT NULL,
  `expected_end_date` date DEFAULT NULL,
  `projected_end_date` date DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `final_grade` double DEFAULT NULL,
  `final_grade_letter` varchar(3) DEFAULT NULL,
  `modified_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_class` (`userid`,`classid`),
  KEY `user` (`userid`),
  KEY `class` (`classid`)
);
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
    DROP TABLE progress_report
SQL;
        $this->execute($sql);


    }
}
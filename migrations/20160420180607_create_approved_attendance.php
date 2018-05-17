<?php

use Phinx\Migration\AbstractMigration;

class CreateApprovedAttendance extends AbstractMigration
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
   CREATE TABLE IF NOT EXISTS `approved_attendance_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `classid` int(11) NOT NULL,
  `date` date NOT NULL,
  `modified_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `time` int(11) NOT NULL,
  `absent` tinyint(1) DEFAULT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `attendance_only` tinyint(1) DEFAULT '0',
  `synced_on` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index1` (`userid`,`classid`,`date`),
  KEY `index2` (`modified_on`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
SQL;
    $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}
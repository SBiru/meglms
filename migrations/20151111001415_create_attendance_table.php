<?php

use Phinx\Migration\AbstractMigration;

class CreateAttendanceTable extends AbstractMigration
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
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `classid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `time` int(11) DEFAULT NULL COMMENT 'time spent in seconds',
  PRIMARY KEY (`id`),
  UNIQUE KEY `userclass` (`date`,`classid`,`userid`)
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
drop table attendance;
SQL;
        $this->execute($sql);
    }
}
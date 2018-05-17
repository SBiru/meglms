<?php

use Phinx\Migration\AbstractMigration;

class CreateUserAttendanceOnlyClasses extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `user_attendance_only_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `classid` int(10) NOT NULL,
  `date_started` date NOT NULL,
  `date_left` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index2` (`userid`,`classid`)
)
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
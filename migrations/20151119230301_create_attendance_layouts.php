<?php

use Phinx\Migration\AbstractMigration;

class CreateAttendanceLayouts extends AbstractMigration
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
CREATE TABLE `attendance_layouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) DEFAULT NULL,
  `orgid` int(11) DEFAULT NULL,
  `name` varchar(45) DEFAULT NULL,
  `is_shared` tinyint(1) DEFAULT NULL,
  `options` text COMMENT 'json with layout options',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_name` (`userid`,`name`)
)
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
drop table attendance_layouts
SQL;
        $this->execute($sql);
    }
}
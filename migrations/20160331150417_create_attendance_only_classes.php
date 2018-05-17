<?php

use Phinx\Migration\AbstractMigration;

class CreateAttendanceOnlyClasses extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `attendance_only_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `external_id` int(11) NOT NULL,
  `department_id` int(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index2` (`external_id`,`department_id`)
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
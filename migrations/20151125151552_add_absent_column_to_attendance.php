<?php

use Phinx\Migration\AbstractMigration;

class AddAbsentColumnToAttendance extends AbstractMigration
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
ALTER TABLE `attendance`
ADD COLUMN `absent` TINYINT(1) NULL AFTER `time`;
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `attendance`
DROP COLUMN `absent`;
SQL;
        $this->execute($sql);
    }
}
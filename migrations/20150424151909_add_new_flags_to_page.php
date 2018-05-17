<?php

use Phinx\Migration\AbstractMigration;

class AddNewFlagsToPage extends AbstractMigration
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
ALTER TABLE `pages`
ADD COLUMN `task_type` VARCHAR(255) NULL AFTER `rubricid`,
ADD COLUMN `task_duration` INT NULL AFTER `task_type`,
ADD COLUMN `show_created_date` TINYINT NULL AFTER `task_duration`,
ADD COLUMN `show_objectives` TINYINT NULL AFTER `show_created_date`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `pages`
DROP COLUMN `task_type`,
DROP COLUMN `task_duration`,
DROP COLUMN `show_created_date`,
DROP COLUMN `show_objectives`
SQL;
        $this->execute($sql);
    }
}
<?php

use Phinx\Migration\AbstractMigration;

class AddFilterFieltsToModules extends AbstractMigration
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
ALTER TABLE `modules`
ADD COLUMN `user_id` INT NULL AFTER `base_language`,
ADD COLUMN `department_id` INT NULL AFTER `user_id`,
ADD COLUMN `org_id` INT NULL AFTER `department_id`,
ADD COLUMN `course_id` INT NULL AFTER `org_id`;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `modules`
DROP COLUMN department_id,
DROP COLUMN org_id,
DROP COLUMN course_id,
DROP COLUMN user_id

SQL;
        $this->execute($sql);
    }


}
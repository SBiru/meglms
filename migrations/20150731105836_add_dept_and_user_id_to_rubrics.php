<?php

use Phinx\Migration\AbstractMigration;

class AddDeptAndUserIdToRubrics extends AbstractMigration
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
ALTER TABLE `rubrics`
ADD COLUMN `department_id` INT NULL AFTER `cols`,
ADD COLUMN `user_id` INT NULL AFTER `department_id`;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `rubrics`
DROP COLUMN department_id,
DROP COLUMN user_id;

SQL;
        $this->execute($sql);
    }


}
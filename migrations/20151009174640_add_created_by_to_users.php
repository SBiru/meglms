<?php

use Phinx\Migration\AbstractMigration;

class AddCreatedByToUsers extends AbstractMigration
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
ALTER TABLE `users`
ADD COLUMN `created_by` INT NULL AFTER `teacher_supervisor`;
SQL;
        $this->execute($sql);


    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `users`
DROP COLUMN `created_by`;
SQL;
        $this->execute($sql);
    }
}
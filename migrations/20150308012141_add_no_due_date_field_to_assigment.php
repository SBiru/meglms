<?php

use Phinx\Migration\AbstractMigration;

class AddNoDueDateFieldToAssigment extends AbstractMigration
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
ALTER TABLE class_assignments 
ADD no_due_date tinyint(1) NOT NULL DEFAULT 0
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE class_assignments 
DROP no_due_date
SQL;
        $this->execute($sql);
    }
}
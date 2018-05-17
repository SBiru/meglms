<?php

use Phinx\Migration\AbstractMigration;

class AddClassidFilesupladed extends AbstractMigration
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
alter table `filesuploaded` add column `class_id` int (10)   NULL  after `ext`
SQL;

        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE filesuploaded DROP class_id
SQL;
        $this->execute($sql);
    }
}
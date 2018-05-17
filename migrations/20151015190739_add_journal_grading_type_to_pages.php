<?php

use Phinx\Migration\AbstractMigration;

class AddJournalGradingTypeToPages extends AbstractMigration
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
ADD COLUMN `journal_grading_type` INT NOT NULL DEFAULT 0
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL

SQL;
        $this->execute($sql);


    }
}


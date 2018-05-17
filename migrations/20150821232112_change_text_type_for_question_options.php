<?php

use Phinx\Migration\AbstractMigration;

class ChangeTextTypeForQuestionOptions extends AbstractMigration
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
ALTER TABLE `question_options`
CHANGE COLUMN `text` `text` TEXT NULL DEFAULT NULL ;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `question_options`
CHANGE COLUMN `text` `text` VARCHAR(255) NULL DEFAULT NULL ;
SQL;
        $this->execute($sql);
    }
}
<?php

use Phinx\Migration\AbstractMigration;

class ChangeQuestionTypeFieldType extends AbstractMigration
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
    ALTER TABLE `questions`
    CHANGE COLUMN `type` `type` VARCHAR(255) NOT NULL DEFAULT 'open' ;
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
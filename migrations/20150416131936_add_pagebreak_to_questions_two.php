<?php

use Phinx\Migration\AbstractMigration;

class AddPagebreakToQuestionsTwo extends AbstractMigration
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
ALTER TABLE `questions` ADD COLUMN `pagebreak` int (1)  DEFAULT '0' NULL  AFTER `extra`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `questions` DROP COLUMN `pagebreak`
SQL;
        $this->execute($sql);
    }
}
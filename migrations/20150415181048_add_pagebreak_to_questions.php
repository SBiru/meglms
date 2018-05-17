<?php

use Phinx\Migration\AbstractMigration;

class AddPagebreakToQuestions extends AbstractMigration
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
ALTER TABLE `questions` CHANGE `type` `type` enum ('open','single','multiple','oneword','truefalse','matching','blank','essay','pagebreak')  DEFAULT 'open' NOT NULL
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `questions` CHANGE `type` `type` enum ('open','single','multiple','oneword','truefalse','matching','blank','essay')  DEFAULT 'open' NOT NULL
SQL;
        $this->execute($sql);
    }
}
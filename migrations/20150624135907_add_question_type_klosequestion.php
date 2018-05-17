<?php

use Phinx\Migration\AbstractMigration;

class AddQuestionTypeKlosequestion extends AbstractMigration
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
ALTER TABLE `meglms`.`questions` CHANGE `type` `type` enum ('open','single','multiple','oneword','truefalse','matching','blank','essay','wordmatching','studentvideoresponse','klosequestions')  DEFAULT 'open' NOT NULL 
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `meglms`.`questions` CHANGE `type` `type` enum ('open','single','multiple','oneword','truefalse','matching','blank','essay','wordmatching','studentvideoresponse')  DEFAULT 'open' NOT NULL 
SQL;
        $this->execute($sql);
    }

}
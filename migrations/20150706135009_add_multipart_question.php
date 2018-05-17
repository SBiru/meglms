<?php

use Phinx\Migration\AbstractMigration;

class AddMultipartQuestion extends AbstractMigration
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
alter table `meglms`.`questions` change `type` `type` enum ('open','single','multiple','oneword','truefalse','matching','blank','essay','wordmatching','studentvideoresponse','klosequestions','multipart')  DEFAULT 'open' NOT NULL 
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
alter table `meglms`.`questions` change `type` `type` enum ('open','single','multiple','oneword','truefalse','matching','blank','essay','wordmatching','studentvideoresponse','klosequestions')  DEFAULT 'open' NOT NULL 
SQL;
        $this->execute($sql);
    }


}
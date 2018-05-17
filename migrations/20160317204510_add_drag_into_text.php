<?php

use Phinx\Migration\AbstractMigration;

class AddDragIntoText extends AbstractMigration
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
CHANGE COLUMN `type` `type` ENUM('dragintotext','information','open','single','multiple','oneword','truefalse','matching','blank','essay','wordmatching','studentvideoresponse','klosequestions','multipart') NOT NULL DEFAULT 'open' ;
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
<?php

use Phinx\Migration\AbstractMigration;

class FieldChangetypeQuestions extends AbstractMigration
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
ALTER table `questions` 
CHANGE `type` `type` enum ('open','single','multiple','oneword','truefalse','matchng','blank')  
DEFAULT 'open' NOT NULL ;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
      $sql = <<<SQL
ALTER table `questions` 
CHANGE `type` `type` enum ('open','single','multiple')  
DEFAULT 'open' NOT NULL ;
SQL;
    }
}
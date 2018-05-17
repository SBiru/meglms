<?php

use Phinx\Migration\AbstractMigration;

class ChangeResponseResponse extends AbstractMigration
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
ALTER TABLE quiz_responses CHANGE response response  TEXT   NULL 
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
                $sql = <<<SQL
ALTER TABLE quiz_responses CHANGE response response  varchar (255)   NULL 
SQL;
        $this->execute($sql);

    }
}
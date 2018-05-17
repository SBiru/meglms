<?php

use Phinx\Migration\AbstractMigration;

class RandomBankId extends AbstractMigration
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
ALTER TABLE quiz_questions
ADD bank_id int (11)  DEFAULT '0' NULL
COMMENT 'Golabs 28/02/2015 Adding in Random  bank_id'
SQL;

        $this->execute($sql);    
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE quiz_questions
DROP bank_id
SQL;
        $this->execute($sql);
    }
}
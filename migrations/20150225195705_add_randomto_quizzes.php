<?php

use Phinx\Migration\AbstractMigration;

class AddRandomtoQuizzes extends AbstractMigration
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
ALTER TABLE quizzes
ADD qtype varchar (20)  DEFAULT 'normal' NULL,
ADD random int (11)  DEFAULT '0' NULL
COMMENT 'Golabs 26/02/2015 Adding in quzztype and random numbers'
SQL;

        $this->execute($sql);    
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE quizzes
DROP qtype,
DROP random
SQL;
        $this->execute($sql);
    }
}
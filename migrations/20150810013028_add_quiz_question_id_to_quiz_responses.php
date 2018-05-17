<?php

use Phinx\Migration\AbstractMigration;

class AddQuizQuestionIdToQuizResponses extends AbstractMigration
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

ALTER TABLE `quiz_responses`
ADD COLUMN `quiz_question_id` INT NULL AFTER `is_correct`;

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
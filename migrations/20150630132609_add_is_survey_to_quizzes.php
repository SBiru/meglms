<?php

use Phinx\Migration\AbstractMigration;

class AddIsSurveyToQuizzes extends AbstractMigration
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
ALTER TABLE `quizzes`
ADD COLUMN `is_survey` TINYINT(1) NULL DEFAULT '0' AFTER `is_private`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `quizzes`
DROP COLUMN `is_survey`
SQL;
        $this->execute($sql);
    }


}
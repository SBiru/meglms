<?php

use Phinx\Migration\AbstractMigration;

class AddTeacherFeedbackFlagToPost extends AbstractMigration
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
ALTER TABLE `posts`
ADD COLUMN `teacher_feedback` TINYINT(1) NULL DEFAULT '0' AFTER `groupid`;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `posts`
DROP COLUMN `teacher_feedback`
SQL;
        $this->execute($sql);
    }
}
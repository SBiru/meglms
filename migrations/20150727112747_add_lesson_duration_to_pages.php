<?php

use Phinx\Migration\AbstractMigration;

class AddLessonDurationToPages extends AbstractMigration
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
ALTER TABLE `pages`
ADD COLUMN `lesson_duration` DOUBLE NULL DEFAULT '1' AFTER `external_id`;


SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `pages`
DROP COLUMN `lesson_duration` ;

SQL;
        $this->execute($sql);
    }


}
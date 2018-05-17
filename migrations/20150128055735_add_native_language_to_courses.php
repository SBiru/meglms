<?php

use Phinx\Migration\AbstractMigration;

class AddNativeLanguageToCourses extends AbstractMigration
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
        ALTER TABLE `courses`
ADD COLUMN `native_language` CHAR(2) NULL AFTER `created`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `courses`
DROP COLUMN `native_language`;
SQL;
        $this->execute($sql);
    }
}
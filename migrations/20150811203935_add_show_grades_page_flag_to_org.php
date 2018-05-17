<?php

use Phinx\Migration\AbstractMigration;

class AddShowGradesPageFlagToOrg extends AbstractMigration
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

ALTER TABLE `organizations`
ADD COLUMN `hide_grades_page` TINYINT(1) NULL DEFAULT '0' AFTER `calculate_progress`;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL

ALTER TABLE `organizations`
DROP COLUMN hide_grades_page

SQL;
        $this->execute($sql);
    }
}
<?php

use Phinx\Migration\AbstractMigration;

class ChangeCourseAndClassNamesLength extends AbstractMigration
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
            ALTER TABLE `classes` CHANGE COLUMN `name` `name` VARCHAR(100);
            ALTER TABLE `courses` CHANGE COLUMN `name` `name` VARCHAR(100);
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
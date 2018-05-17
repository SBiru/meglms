<?php

use Phinx\Migration\AbstractMigration;

class AddTermIdToClassesTable extends AbstractMigration
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
ALTER TABLE `classes` 
ADD COLUMN `term_id` INT NULL AFTER `created`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `classes` 
DROP COLUMN `term_id`;
SQL;
        $this->execute($sql);
    }
}
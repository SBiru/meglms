<?php

use Phinx\Migration\AbstractMigration;

class AddRowsAndColsToRubrics extends AbstractMigration
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
ALTER TABLE `rubrics`
ADD COLUMN `rows` INT NULL DEFAULT '8' AFTER `org_id`,
ADD COLUMN `cols` INT NULL DEFAULT '6' AFTER `rows`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `rubrics`
DROP COLUMN `rows`,
DROP COLUMN `cols`;
SQL;
        $this->execute($sql);
    }
}
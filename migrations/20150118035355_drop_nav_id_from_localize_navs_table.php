<?php

use Phinx\Migration\AbstractMigration;

class DropNavIdFromLocalizeNavsTable extends AbstractMigration
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
            ALTER TABLE `localize_navs`
            DROP COLUMN `nav_id`,
            DROP INDEX `nav_id_2` ,
            DROP INDEX `nav_id` ;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
            ALTER TABLE `localize_navs`
            ADD COLUMN `nav_id` INT(11) NOT NULL;
SQL;
        $this->execute($sql);
    }
}
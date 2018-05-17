<?php

use Phinx\Migration\AbstractMigration;

class AddLanguageColumnsToModules extends AbstractMigration
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
ALTER TABLE `modules`
ADD COLUMN `target_languange` VARCHAR(2) NULL DEFAULT 'en' AFTER `description`,
ADD COLUMN `base_language` VARCHAR(2) NULL AFTER `target_languange`
SQL;

        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `modules`
DROP COLUMN `target_languange`,
DROP COLUMN `base_language`
SQL;

        $this->execute($sql);
    }
}
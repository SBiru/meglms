<?php

use Phinx\Migration\AbstractMigration;

class ChangesToHtmlTemplate extends AbstractMigration
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
    ALTER TABLE `html_templates`
    DROP COLUMN `html`,
    ADD COLUMN `template_url` VARCHAR(100) NULL AFTER `description`,
    ADD COLUMN `template_image` VARCHAR(100) NULL AFTER `template_url`,
    ADD COLUMN `template_options` TEXT NULL AFTER `template_image`;
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
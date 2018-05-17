<?php

use Phinx\Migration\AbstractMigration;

class AddGenderAndSiteFlags extends AbstractMigration
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
ADD COLUMN `show_gender` TINYINT(1) NULL DEFAULT '0' AFTER `hide_expected_end_date`,
ADD COLUMN `show_site` TINYINT(1) NULL DEFAULT '0' AFTER `show_gender`;
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
DROP COLUMN `show_gender`,
DROP COLUMN `show_gender`;
SQL;
        $this->execute($sql);


    }
}
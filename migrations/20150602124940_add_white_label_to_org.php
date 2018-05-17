<?php

use Phinx\Migration\AbstractMigration;

class AddWhiteLabelToOrg extends AbstractMigration
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
ADD COLUMN `white_label` TINYINT(1) NULL AFTER `logo`;

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
DROP COLUMN `white_label`
SQL;
        $this->execute($sql);
    }
}
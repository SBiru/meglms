<?php

use Phinx\Migration\AbstractMigration;

class AddGateAndMinimumscoreToPages extends AbstractMigration
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
ALTER TABLE `pages`
ADD COLUMN `gate` INT NULL DEFAULT 0 AFTER `objective`,
ADD COLUMN `minimum_score` INT NULL DEFAULT 0 AFTER `gate`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `pages`
DROP COLUMN `gate`,
DROP COLUMN `minimum_score`;
SQL;
        $this->execute($sql);
    }
}
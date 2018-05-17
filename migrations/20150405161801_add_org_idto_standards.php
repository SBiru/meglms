<?php

use Phinx\Migration\AbstractMigration;

class AddOrgIdtoStandards extends AbstractMigration
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
ALTER TABLE standards ADD COLUMN org_id INT(11) NULL after `parentid`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE standards DROP COLUMN org_id
SQL;
        $this->execute($sql);
    }
}

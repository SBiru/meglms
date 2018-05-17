<?php

use Phinx\Migration\AbstractMigration;

class AddPageTypePermissionToOrganizations extends AbstractMigration
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
ALTER TABLE organizations ADD COLUMN page_type_permissions INT(11)  NULL DEFAULT '19'  after `created`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE organizations DROP COLUMN page_type_permissions
SQL;
        $this->execute($sql);
    }
}

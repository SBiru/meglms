<?php

use Phinx\Migration\AbstractMigration;

class CreateOrganizationPreferencesTable extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `organization_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `org_id` int(11) DEFAULT NULL,
  `preference` varchar(100) DEFAULT NULL,
  `value` text,
  PRIMARY KEY (`id`)
);
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
  DROP TABLE organization_preferences
SQL;
        $this->execute($sql);
    }

}
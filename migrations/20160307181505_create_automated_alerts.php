<?php

use Phinx\Migration\AbstractMigration;

class CreateAutomatedAlerts extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `automated_alerts` (
  `id` int(11) NOT NULL,
  `org_id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT '0',
  `test_version` tinyint(1) DEFAULT '1',
  `addressees` varchar(1000) DEFAULT '[]',
  `frequency` varchar(500) DEFAULT '{"period":"weekly","day":1,"time":"12:00"}',
  `options` text,
  `last_run` timestamp NULL DEFAULT NULL,
  `modified_on` timestamp NULL DEFAULT NULL,
  `modified_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
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
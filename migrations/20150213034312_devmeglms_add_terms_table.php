<?php

use Phinx\Migration\AbstractMigration;

class DevmeglmsAddTermsTable extends AbstractMigration
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
CREATE TABLE `terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
)
SQL;
	$this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
$sql = <<<SQL
DROP TABLE terms;
SQL;
	$this->execute($sql);
    }
}
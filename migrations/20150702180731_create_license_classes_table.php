<?php

use Phinx\Migration\AbstractMigration;

class CreateLicenseClassesTable extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `license_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `license_batchid` varchar(45) NOT NULL,
  `classid` int(11) NOT NULL,
  `groupid` int(11) DEFAULT NULL,
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
  DROP TABLE license_classes
SQL;
        $this->execute($sql);
    }

}
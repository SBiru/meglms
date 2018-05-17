<?php

use Phinx\Migration\AbstractMigration;

class CreateUserAlertsTable extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `user_alerts` (
  `userid` INT NOT NULL,
  `alerts_json` MEDIUMTEXT NULL,
  PRIMARY KEY (`userid`));

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
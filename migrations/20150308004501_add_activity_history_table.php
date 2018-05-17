<?php

use Phinx\Migration\AbstractMigration;

class AddActivityHistoryTable extends AbstractMigration
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
CREATE TABLE `activity_history` (
    `id` INT NOT NULL AUTO_INCREMENT,
  `userid` INT NULL,
  `pageid` INT NULL,
  `time_in` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `time_out` TIMESTAMP NULL,
  PRIMARY KEY (`id`));
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE activity_history;
SQL;
        $this->execute($sql);
    }
}
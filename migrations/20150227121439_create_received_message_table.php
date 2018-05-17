<?php

use Phinx\Migration\AbstractMigration;

class CreateReceivedMessageTable extends AbstractMigration
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
  CREATE TABLE `received_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `message_id` INT NULL,
  `user_id` INT NULL,
  `read` INT(1) NULL DEFAULT 0,
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
DROP TABLE received_messages;
SQL;
        $this->execute($sql);
    }

}
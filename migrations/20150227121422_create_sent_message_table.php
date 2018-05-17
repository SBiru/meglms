<?php

use Phinx\Migration\AbstractMigration;

class CreateSentMessageTable extends AbstractMigration
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
CREATE TABLE `sent_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `subject` TEXT NULL,
  `message` TEXT NULL,
  `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
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
DROP TABLE sent_messages;
SQL;
        $this->execute($sql);
    }

}
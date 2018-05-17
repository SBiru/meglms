<?php

use Phinx\Migration\AbstractMigration;

class CreateUserSessionsTable extends AbstractMigration
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

        CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` INT NOT NULL AUTO_INCREMENT,
  `userid` INT NULL,
  `sessions` INT NULL,
  `total_time` INT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `USER` (`userid` ASC));
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
    DROP TABLE user_sessions;
SQL;
        $this->execute($sql);
    }
}
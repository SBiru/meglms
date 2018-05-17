<?php

use Phinx\Migration\AbstractMigration;

class CreateUserAdminSites extends AbstractMigration
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
    CREATE TABLE IF NOT EXISTS `user_admin_sites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) DEFAULT NULL,
  `siteid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_site` (`userid`,siteid)
);
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
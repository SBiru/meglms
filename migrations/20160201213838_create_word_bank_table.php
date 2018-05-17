<?php

use Phinx\Migration\AbstractMigration;

class CreateWordBankTable extends AbstractMigration
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
    CREATE TABLE IF NOT EXISTS `word_bank` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL,
  `orgId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index2` (`word`,`orgId`)
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
<?php

use Phinx\Migration\AbstractMigration;

class CreateTablePagemaxpoints extends AbstractMigration
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

CREATE TABLE `page_maxpoints_log` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
  `pageid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `changedBy` int(11) NOT NULL,
  `old_score` double NOT NULL,
  `new_score` double NOT NULL,
  PRIMARY KEY (`id`));
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
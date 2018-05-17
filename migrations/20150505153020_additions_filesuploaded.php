<?php

use Phinx\Migration\AbstractMigration;

class AdditionsFilesuploaded extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `filesuploaded` (
`id` char(30) NOT NULL,
`filename` tinytext, 
`ext` char(10) DEFAULT NULL,
`folder` text,
`user_id` int (10)   NULL,
`ptype` varchar (10)  DEFAULT 'file' NULL,
`pdate` timestamp  DEFAULT CURRENT_TIMESTAMP NULL,
`size` int (15)   NULL,
PRIMARY KEY (`id`)   ) 
ENGINE=InnoDB DEFAULT CHARSET=latin1;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
 DROP TABLE `meglms`.`filesuploaded`;
SQL;
        $this->execute($sql);
    }
}
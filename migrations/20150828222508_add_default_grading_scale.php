<?php

use Phinx\Migration\AbstractMigration;

class AddDefaultGradingScale extends AbstractMigration
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
ALTER TABLE `classes`
CHANGE COLUMN `a_plus_max` `a_plus_max` TINYINT(1) NULL DEFAULT 100 ,
CHANGE COLUMN `a_plus_min` `a_plus_min` TINYINT(1) NULL DEFAULT 96 ,
CHANGE COLUMN `a_max` `a_max` TINYINT(1) NULL DEFAULT 95 ,
CHANGE COLUMN `a_min` `a_min` TINYINT(1) NULL DEFAULT 93 ,
CHANGE COLUMN `a_minus_max` `a_minus_max` TINYINT(1) NULL DEFAULT 92 ,
CHANGE COLUMN `a_minus_min` `a_minus_min` TINYINT(1) NULL DEFAULT 90 ,
CHANGE COLUMN `b_plus_max` `b_plus_max` TINYINT(1) NULL DEFAULT 89 ,
CHANGE COLUMN `b_plus_min` `b_plus_min` TINYINT(1) NULL DEFAULT 86 ,
CHANGE COLUMN `b_max` `b_max` TINYINT(1) NULL DEFAULT 85 ,
CHANGE COLUMN `b_min` `b_min` TINYINT(1) NULL DEFAULT 83 ,
CHANGE COLUMN `b_minus_max` `b_minus_max` TINYINT(1) NULL DEFAULT 82 ,
CHANGE COLUMN `b_minus_min` `b_minus_min` TINYINT(1) NULL DEFAULT 80 ,
CHANGE COLUMN `c_plus_max` `c_plus_max` TINYINT(1) NULL DEFAULT 79 ,
CHANGE COLUMN `c_plus_min` `c_plus_min` TINYINT(1) NULL DEFAULT 76 ,
CHANGE COLUMN `c_max` `c_max` TINYINT(1) NULL DEFAULT 75 ,
CHANGE COLUMN `c_min` `c_min` TINYINT(1) NULL DEFAULT 73 ,
CHANGE COLUMN `c_minus_max` `c_minus_max` TINYINT(1) NULL DEFAULT 72 ,
CHANGE COLUMN `c_minus_min` `c_minus_min` TINYINT(1) NULL DEFAULT 70 ,
CHANGE COLUMN `d_plus_max` `d_plus_max` TINYINT(1) NULL DEFAULT 69 ,
CHANGE COLUMN `d_plus_min` `d_plus_min` TINYINT(1) NULL DEFAULT 66 ,
CHANGE COLUMN `d_max` `d_max` TINYINT(1) NULL DEFAULT 65 ,
CHANGE COLUMN `d_min` `d_min` TINYINT(1) NULL DEFAULT 63 ,
CHANGE COLUMN `d_minus_max` `d_minus_max` TINYINT(1) NULL DEFAULT 62 ,
CHANGE COLUMN `d_minus_min` `d_minus_min` TINYINT(1) NULL DEFAULT 60 ;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL

SQL;
        $this->execute($sql);


    }
}
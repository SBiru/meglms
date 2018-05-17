<?php

use Phinx\Migration\AbstractMigration;

class AddSuperUnit extends AbstractMigration
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
        $table = $this->table('classes');
        if(!$table->hasColumn('use_super_units')){
            $table->addColumn('use_super_units','integer',array('limit' => 1,'null'=>true))->update();
        }
        $this->execute($this->createSuperUnit);
        $this->execute($this->createUnitSuperUnits);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
    private $createSuperUnit = <<<SQL
    CREATE TABLE IF NOT EXISTS `super_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `classid` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `position` int(11) NOT NULL DEFAULT '1',
  `hide_from_student` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `position` (`classid`,`position`),
  UNIQUE KEY `name` (`classid`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SQL;
    private $createUnitSuperUnits = <<<SQL
    CREATE TABLE `unit_superunits` (
  `superunitid` int(11) NOT NULL,
  `unitid` int(11) NOT NULL,
  PRIMARY KEY (`superunitid`,`unitid`),
  UNIQUE KEY `unitid_UNIQUE` (`unitid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SQL;

}
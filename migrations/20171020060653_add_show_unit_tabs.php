<?php

use Phinx\Migration\AbstractMigration;

class AddShowUnitTabs extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $table = $this->table('organizations');
        if(!$table->hasColumn('show_unit_tabs')){
            $table->addColumn('show_unit_tabs','integer',array
            ('limit'=>\Phinx\Db\Adapter\MysqlAdapter::INT_TINY,'default'=>'0'))
                ->update();
        }
        $table = $this->table('classes');
        if(!$table->hasColumn('show_unit_tabs')){
            $table->addColumn('show_unit_tabs','integer',array
            ('limit'=>\Phinx\Db\Adapter\MysqlAdapter::INT_TINY,'null'=>true))
                ->update();
        }
    }
}

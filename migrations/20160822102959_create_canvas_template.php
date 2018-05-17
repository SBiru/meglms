<?php

use Phinx\Migration\AbstractMigration;

class CreateCanvasTemplate extends AbstractMigration
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
        $exists = $this->hasTable('canvas_templates');
        if(!$exists){
            $table = $this->table('canvas_templates');
            $table->addColumn('name','string',['limit'=>255])
                ->addColumn('created_by','integer')
                ->addColumn('modified_by','integer')
                ->addColumn('classid','integer',array('null'=>true))
                ->addColumn('is_private','integer',array('default'=>0,'limit'=>1,'null'=>true))
                ->addColumn('created', 'timestamp', array('default' => 'CURRENT_TIMESTAMP'))
                ->addColumn('modified', 'timestamp')
                ->addColumn('canvas_json', 'text')
                ->create();
        }
    }
}

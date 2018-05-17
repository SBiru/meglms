<?php

use Phinx\Migration\AbstractMigration;

class CreateFinalGrades extends AbstractMigration
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
        $exists = $this->hasTable('final_grades');
        if(!$exists){
            $table = $this->table('final_grades');
            $table->addColumn('orgid','integer')
                ->addColumn('userid','integer')
                ->addColumn('external_userid','integer')
                ->addColumn('classid','integer')
                ->addColumn('sectionid','integer',array('null'=>true))
                ->addColumn('teacherid','integer')
                ->addColumn('external_teacherid','integer')
                ->addColumn('grade','string',array('limit' => '10'))
                ->addColumn('modified_on','timestamp',array('default' => 'CURRENT_TIMESTAMP'))
                ->addColumn('export_filename','string',array('null'=>true,'limit' => '150'))
                ->addIndex(array('userid'))
                ->addIndex(array('classid'))
                ->addIndex(array('export_filename'))
                ->create();
        }
    }
}

<?php

use Phinx\Migration\AbstractMigration;

class CreateGlossaryImportTables extends AbstractMigration
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
        $table = $this->table('glossary_upload_files');
        if(!$table->exists()){
            $table->addColumn('org_id','integer')
                ->addColumn('filename','string',['limit'=>\Phinx\Db\Adapter\MysqlAdapter::TEXT_TINY])
                ->addColumn('ext','string',['limit'=>'10'])
                ->addColumn('size','integer',['limit'=>15])
                ->addColumn('entries','integer')
                ->addColumn('created_by','integer')
                ->addColumn('created_on','timestamp',['default'=>'CURRENT_TIMESTAMP'])
                ->create();
        }
        $table = $this->table('glossary_upload_entries');
        if(!$table->exists()){
            $table->addColumn('file_id','integer')
                ->addColumn('word','string',['limit'=>\Phinx\Db\Adapter\MysqlAdapter::TEXT_TINY])
                ->addColumn('description','string',['limit'=>\Phinx\Db\Adapter\MysqlAdapter::TEXT_REGULAR])
                ->addColumn('tags','string',['limit'=>\Phinx\Db\Adapter\MysqlAdapter::TEXT_REGULAR])
                ->addColumn('extra','string',['limit'=>\Phinx\Db\Adapter\MysqlAdapter::TEXT_MEDIUM])
                ->create();
        }

    }
}

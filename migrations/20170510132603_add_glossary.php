<?php

use Phinx\Migration\AbstractMigration;

class AddGlossary extends AbstractMigration
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
        $exists = $this->hasTable('glossary_tags');
        if(!$exists){
            $table = $this->table('glossary_tags');
            $table->addColumn('org_id','integer')
                ->addColumn('name', 'string', array('limit' => 100))
                ->addColumn('created_by', 'integer')
                ->addColumn('created_on', 'timestamp',array('default'=>"CURRENT_TIMESTAMP"))
                ->addIndex(array('org_id', 'name'), array('unique' => true))
                ->create();

        }
        $exists = $this->hasTable('glossary_word_tags');
        if(!$exists){
            $table = $this->table('glossary_word_tags',array('id' => false,'primary_key' =>array('word_id','tag_id')));
            $table->addColumn('word_id','integer')
                ->addColumn('tag_id','integer')
                ->create();
        }
        $exists = $this->hasTable('glossary_words');
        if(!$exists){
            $table = $this->table('glossary_words');
            $table->addColumn('org_id','integer')
                ->addColumn('word', 'string', array('limit' => 255))
                ->addColumn('description', 'string', array('limit' => \Phinx\Db\Adapter\MysqlAdapter::TEXT_REGULAR))
                ->addColumn('created_by', 'integer')
                ->addColumn('created_on', 'timestamp',array('default'=>"CURRENT_TIMESTAMP"))
                ->addIndex(array('org_id', 'word'), array('unique' => true))
                ->create();
        }
        $exists = $this->hasTable('glossary');
        if(!$exists){
            $table = $this->table('glossary');
            $table->addColumn('pageid','integer')
                ->addColumn('wordid', 'integer')
                ->addIndex(array('pageid', 'wordid'), array('unique' => true))
                ->create();
        }
    }
}

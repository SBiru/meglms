<?php

use Phinx\Migration\AbstractMigration;

class ChangeGlossaryTables extends AbstractMigration
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

        $this->createDefinitions();
        $this->createDefTags();
        $this->removeDefColumn();
        $this->dropWordTags();
        $this->createPageDefinitions();
    }

    private function createDefinitions()
    {
        $glossary_definitions = $this->table('glossary_definitions');
        if (!$glossary_definitions->exists()) {
            $glossary_definitions->addColumn('org_id', 'integer')
                ->addColumn('word_id', 'integer', array('limit' => 10))
                ->addColumn('definition', 'string', array('limit' => \Phinx\Db\Adapter\MysqlAdapter::TEXT_REGULAR))
                ->addColumn('created_by', 'integer')
                ->addColumn('created_on', 'timestamp', array('default' => "CURRENT_TIMESTAMP"))
                ->addIndex(array('word_id'))
                ->addIndex(array('org_id'))
                ->addIndex(array('created_by'))
                ->create();
        }
    }
    private function createDefTags(){
        if(!$this->hasTable('glossary_definition_tags')){
            $glossary_definition_tags = $this->table('glossary_definition_tags',array('id' => false,'primary_key'
            =>array('definition_id','tag_id')));
            $glossary_definition_tags->addColumn('definition_id','integer')
                ->addColumn('tag_id','integer')
                ->create();
        }
    }

    private function removeDefColumn(){
        $glossary_words = $this->table('glossary_words');
        if($glossary_words->exists() && $glossary_words->hasColumn('description')){
            $this->populateDefinitions();
            $this->populateDefTags();
            $glossary_words->removeColumn('description')->update();

        }
    }
    private function populateDefinitions(){
        $words = $this->fetchAll('SELECT * FROM glossary_words');
        $definitions = $this->table('glossary_definitions');
        foreach ($words as $word){
            $definitions->insert([
               'org_id'=>$word['org_id'],
               'word_id'=>$word['id'],
               'definition'=>$word['description'],
               'created_by'=>$word['created_by'],
               'created_on'=>$word['created_on'],
            ]);
        }
        $definitions->saveData();
    }
    private function dropWordTags(){
        $glossary_word_tags = $this->table('glossary_word_tags');
        if($glossary_word_tags->exists()){
            $glossary_word_tags->drop();
        }
    }
    private function populateDefTags(){
        $sql = <<<SQL
    INSERT INTO glossary_definition_tags (definition_id,tag_id) 
    SELECT d.id, wt.tag_id FROM glossary_definitions d
    JOIN glossary_word_tags wt on wt.word_id = d.word_id
SQL;
        $this->execute($sql);

    }
    private function createPageDefinitions(){
        $glossary_definitions = $this->table('glossary_page_definitions',array('id' => false,'primary_key'
        =>array('definition_id','page_id')));
        if (!$glossary_definitions->exists()) {
            $glossary_definitions->addColumn('page_id', 'integer', array('limit' => 10))
                ->addColumn('definition_id', 'integer', array('limit' => 10))
                ->create();
        }
    }
}

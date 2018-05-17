<?php

use Phinx\Migration\AbstractMigration;

class AddChatGroups extends AbstractMigration
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
        $table = $this->table('chats');
        if(!$table->hasColumn('groupid')) {
            $table->addColumn('groupid', 'integer', array('null'=>true))
                ->update();
        }
        if(!$this->hasTable('chats_groups')){
            $table = $this->table('chats_groups');
            $table->addColumn('users','string',array('limit'=>100))
                ->addIndex('users',array('unique'=>true))
                ->create();
        }
        if(!$this->hasTable('chat_group_messages')){
            $table = $this->table('chat_group_messages',array('id' => false, 'primary_key' => array('user_id','message_id')));
            $table->addColumn('message_id','integer')
                ->addColumn('user_id','integer')
                ->addColumn('read_on','timestamp',array('default'=>'CURRENT_TIMESTAMP'))
                ->create();
        }
        if(!$this->hasTable('chat_group_users')){
            $table = $this->table('chat_group_users',array('id' => false, 'primary_key' => array('userid','groupid')));
            $table->addColumn('userid','integer')
                ->addColumn('groupid','integer')
                ->create();
        }


    }
}

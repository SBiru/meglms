<?php

use Phinx\Migration\AbstractMigration;

class CreateUserWebsocketTokens extends AbstractMigration
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
        $exists = $this->hasTable('user_websocket_tokens');
        if(!$exists){
            $table = $this->table('user_websocket_tokens');
            $table->addColumn('userid','integer')
                ->addColumn('token','string',array('limit'=>20))
                ->addColumn('expiration','timestamp')
                ->addIndex(array('userid'), array('unique' => true))
                ->create();
        }
    }
}

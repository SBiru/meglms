<?php

use Phinx\Migration\AbstractMigration;

class ContentPageAttempts extends AbstractMigration
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
        $table = $this->table('content_page_attempts');
        if(!$table->exists()){
            $create = <<< SQL
    create table content_page_attempts
(
	id int not null auto_increment
		primary key,
	page_id int not null,
	user_id bigint(20) not null,
	attempts_completed int not null DEFAULT 0
);
SQL;
            $this->execute($create);
        }
    }
}
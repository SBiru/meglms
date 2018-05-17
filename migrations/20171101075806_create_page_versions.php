<?php

use Phinx\Migration\AbstractMigration;

class CreatePageVersions extends AbstractMigration
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
        $table = $this->table('page_versions');
        if(!$table->exists()){
            $create = <<< SQL
    create table page_versions
(
	id int not null auto_increment
		primary key,
	pageid int not null,
	content mediumtext null,
	modified_on timestamp default CURRENT_TIMESTAMP not null,
	modified_by int not null
);
SQL;
            $index = <<<SQL
create index page_versions_pageid_index
	on page_versions (pageid)
;
SQL;
            $populate = <<<SQL
insert ignore into page_versions (pageid, content, modified_by) select id,content,0 from pages
SQL;
            $this->execute($create);
            $this->execute($index);
            $this->execute($populate);
        }

    }
}

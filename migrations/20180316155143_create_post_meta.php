<?php

use Phinx\Migration\AbstractMigration;

class CreatePostMeta extends AbstractMigration
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
        $table = $this->table('post_meta');
        if(!$table->exists()){
            $sql = <<<SQL
CREATE TABLE post_meta
(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    post_id BIGINT(20) NOT NULL,
    meta_key VARCHAR(100) NOT NULL,
    meta_value TEXT
);

SQL;
            $this->execute($sql);
            $sql = <<<SQL
CREATE INDEX post_meta_post_id_index ON post_meta (post_id);
SQL;
            $this->execute($sql);
        }


    }
}

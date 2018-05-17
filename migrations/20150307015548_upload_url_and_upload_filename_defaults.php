<?php

use Phinx\Migration\AbstractMigration;

class UploadUrlAndUploadFilenameDefaults extends AbstractMigration
{
    /**
     * Change Method.
     *
     * More information on this method is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-change-method
     *
     * Uncomment this method if you would like to use it.
     *
    public function change()
    {
    }
    */
    
    /**
     * Migrate Up.
     */
    public function up()
    {
        $sql = <<<SQL
ALTER TABLE `posts`
CHANGE COLUMN `upload_url` `upload_url` VARCHAR(255) NOT NULL DEFAULT '' ,
CHANGE COLUMN `upload_file_name` `upload_file_name` VARCHAR(255) NOT NULL DEFAULT '' ;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `posts`
CHANGE COLUMN `upload_url` `upload_url` VARCHAR(255) NOT NULL ,
CHANGE COLUMN `upload_file_name` `upload_file_name` VARCHAR(255) NOT NULL ;
SQL;
        $this->execute($sql);
    }
}

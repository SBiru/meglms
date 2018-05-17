<?php

use Phinx\Migration\AbstractMigration;

class AddTemplatepostPages extends AbstractMigration
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
     * Migrate Down.
     */
    public function up()
    {
        $sql = <<<SQL
ALTER TABLE pages ADD COLUMN `allow_template_post` tinyint (1)  DEFAULT '0' NOT NULL  after `allow_upload_post`
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `pages`
DROP COLUMN `allow_template_post`
SQL;
        $this->execute($sql);
    }
}
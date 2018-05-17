<?php

use Phinx\Migration\AbstractMigration;

class HtmlTemplates extends AbstractMigration
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
CREATE TABLE `html_templates` ( `id` int (10)   NOT NULL AUTO_INCREMENT ,  `orgid` int (5)   NULL ,  `title` tinytext   NULL ,  `description` tinytext   NULL ,  `html` longtext   NULL  , PRIMARY KEY ( `id` )  )

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}
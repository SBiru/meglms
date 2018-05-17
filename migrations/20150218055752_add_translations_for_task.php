<?php

use Phinx\Migration\AbstractMigration;

class AddTranslationsForTask extends AbstractMigration
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
        INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('ar', 'x', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('de', 'Aufgabe', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('en', 'Task', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('es', 'Tarea', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('fr', 'x', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('ko', 'x', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('pt', 'x', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('th', 'x', 'task');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('zh', 'x', 'task');
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        DELETE FROM `localize_navs` WHERE `language` = 'ar' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'de' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'en' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'es' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'fr' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'ko' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'pt' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'th' AND `nav_key` = 'task';
DELETE FROM `localize_navs` WHERE `language` = 'zh' AND `nav_key` = 'task';
SQL;
        $this->execute($sql);
    }
}
<?php

use Phinx\Migration\AbstractMigration;

class AddTranslationsForScore extends AbstractMigration
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
        INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('ar', 'x', 'score');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('de', 'Erzielen', 'score');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('en', 'Score', 'score');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('es', 'Puntuación', 'score');
INSERT INTO `localize_navs` (`language`, `translation`) VALUES ('fr', 'x');
INSERT INTO `localize_navs` (`language`, `translation`) VALUES ('ko', 'x');
INSERT INTO `localize_navs` (`language`, `translation`) VALUES ('th', 'x');
INSERT INTO `localize_navs` (`language`, `translation`) VALUES ('zh', 'x');
INSERT INTO `localize_navs` (`language`, `translation`) VALUES ('pt', 'x');
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        DELETE FROM `localize_navs` WHERE `language` = 'ar' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'de' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'en' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'es' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'fr' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'ko' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'th' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'zh' AND `nav_key` = 'score';
DELETE FROM `localize_navs` WHERE `language` = 'pt' AND `nav_key` = 'score';
SQL;
        $this->execute($sql);
    }
}
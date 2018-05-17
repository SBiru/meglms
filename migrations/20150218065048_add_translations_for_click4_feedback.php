<?php

use Phinx\Migration\AbstractMigration;

class AddTranslationsForClick4Feedback extends AbstractMigration
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
    $sql=<<<SQL
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('ar', 'x', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('de', 'x', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('en', 'Click to see feedback', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('es', 'Oprima para ver comentario', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('fr', 'x', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('ko', 'x', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('pt', 'x', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('th', 'x', 'click_for_feedback');
INSERT INTO `localize_navs` (`language`, `translation`, `nav_key`) VALUES ('zh', 'x', 'click_for_feedback');

SQL;
    $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql=<<<SQL
DELETE FROM `localize_navs` WHERE `language` = 'ar' AND `nav_key` = 'click_for_feedback');
DELETE FROM `localize_navs` WHERE `language` = 'de' AND `nav_key` = 'click_for_feedback');
DELETE FROM `localize_navs` WHERE `language` = 'en' AND `nav_key` = 'click_for_feedback');
DELETE FROM `localize_navs` WHERE `language` = 'es' AND `nav_key` = 'click_for_feedback');
DELETE FROM `localize_navs` WHERE `language` = 'fr' AND `nav_key` = 'click_for_feedback';
DELETE FROM `localize_navs` WHERE `language` = 'ko' AND `nav_key` = 'click_for_feedback';
DELETE FROM `localize_navs` WHERE `language` = 'pt' AND `nav_key` = 'click_for_feedback';
DELETE FROM `localize_navs` WHERE `language` = 'th' AND `nav_key` = 'click_for_feedback';
DELETE FROM `localize_navs` WHERE `language` = 'zh' AND `nav_key` = 'click_for_feedback';

SQL;
        $this->execute($sql);
    }
}
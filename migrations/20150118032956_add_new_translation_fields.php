<?php

use Phinx\Migration\AbstractMigration;

class AddNewTranslationFields extends AbstractMigration
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
            INSERT INTO `navs` (`key`) VALUES ('chatting_to_pre_name');
            INSERT INTO `navs` (`key`) VALUES ('chatting_to_post_name');
            INSERT INTO `navs` (`key`) VALUES ('chat_textbox_placeholder');
            INSERT INTO `navs` (`key`) VALUES ('student');
            INSERT INTO `navs` (`key`) VALUES ('test_bank_builder');
            INSERT INTO `navs` (`key`) VALUES ('course_builder');
            INSERT INTO `navs` (`key`) VALUES ('grader');
            INSERT INTO `navs` (`key`) VALUES ('admin');
            INSERT INTO `navs` (`key`) VALUES ('instructor_feedback');
            INSERT INTO `navs` (`key`) VALUES ('feedback');
            INSERT INTO `navs` (`key`) VALUES ('notification_no_score_pre_name');
            INSERT INTO `navs` (`key`) VALUES ('notification_no_score_post_name');
            INSERT INTO `navs` (`key`) VALUES ('notification_with_score_pre_name');
            INSERT INTO `navs` (`key`) VALUES ('notification_with_score_post_name');
            INSERT INTO `navs` (`key`) VALUES ('notification_with_score_pre_score');
            INSERT INTO `navs` (`key`) VALUES ('notification_with_score_post_score');
            INSERT INTO `navs` (`key`) VALUES ('chat');
            INSERT INTO `navs` (`key`) VALUES ('grades');
            INSERT INTO `navs` (`key`) VALUES ('previous');
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
            DELETE FROM `navs` WHERE `key`='chatting_to_pre_name';
            DELETE FROM `navs` WHERE `key`='chatting_to_post_name';
            DELETE FROM `navs` WHERE `key`='chat_textbox_placeholder';
            DELETE FROM `navs` WHERE `key`='student';
            DELETE FROM `navs` WHERE `key`='test_bank_builder';
            DELETE FROM `navs` WHERE `key`='course_builder';
            DELETE FROM `navs` WHERE `key`='grader';
            DELETE FROM `navs` WHERE `key`='admin';
            DELETE FROM `navs` WHERE `key`='instructor_feedback';
            DELETE FROM `navs` WHERE `key`='notification_no_score_pre_name';
            DELETE FROM `navs` WHERE `key`='notification_no_score_post_name';
            DELETE FROM `navs` WHERE `key`='notification_with_score_pre_name';
            DELETE FROM `navs` WHERE `key`='notification_with_score_post_name';
            DELETE FROM `navs` WHERE `key`='notification_with_score_pre_score';
            DELETE FROM `navs` WHERE `key`='notification_with_score_post_score';
            DELETE FROM `navs` WHERE `key`='chat';
            DELETE FROM `navs` WHERE `key`='grades';
            DELETE FROM `navs` WHERE `key`='previous';
SQL;
        $this->execute($sql);
    }
}
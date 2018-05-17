<?php

use Phinx\Migration\AbstractMigration;

class SetCourseLanguages extends AbstractMigration
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
        UPDATE `courses` SET `native_language`='th' WHERE `name`='Thai Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Advanced 101';
UPDATE `courses` SET `native_language`='es' WHERE `name`='Spanish Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Demo Course';
UPDATE `courses` SET `native_language`='en' WHERE `name`='HR Demo';
UPDATE `courses` SET `native_language`='ar' WHERE `name`='Arabic Demo';
UPDATE `courses` SET `native_language`='fr' WHERE `name`='French Demo';
UPDATE `courses` SET `native_language`='pt' WHERE `name`='Portuguese Demo';
UPDATE `courses` SET `native_language`='ko' WHERE `name`='Korean Demo';
UPDATE `courses` SET `native_language`='zh' WHERE `name`='Mandarin Demo';
UPDATE `courses` SET `native_language`='jp' WHERE `name`='Japanese Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='AISU DEMO';
UPDATE `courses` SET `native_language`='en' WHERE `name`='English Core 1 (Thai)';
UPDATE `courses` SET `native_language`='en' WHERE `name`='English Core 2 (Thai)';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Tutor Interview';
UPDATE `courses` SET `native_language`='en' WHERE `name`='course 1b';
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
                UPDATE `courses` SET `native_language`='en' WHERE `name`='Thai Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Advanced 101';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Spanish Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Demo Course';
UPDATE `courses` SET `native_language`='en' WHERE `name`='HR Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Arabic Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='French Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Portuguese Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Korean Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Mandarin Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Japanese Demo';
UPDATE `courses` SET `native_language`='en' WHERE `name`='AISU DEMO';
UPDATE `courses` SET `native_language`='en' WHERE `name`='English Core 1 (Thai)';
UPDATE `courses` SET `native_language`='en' WHERE `name`='English Core 2 (Thai)';
UPDATE `courses` SET `native_language`='en' WHERE `name`='Tutor Interview';
UPDATE `courses` SET `native_language`='en' WHERE `name`='course 1b';
SQL;
        $this->execute($sql);

    }
}
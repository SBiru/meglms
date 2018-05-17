<?php

use Phinx\Migration\AbstractMigration;

class AddSupportedLanguages extends AbstractMigration
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
        INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('de', 'German', '0');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('fr', 'French', '0');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('es', 'Spanish', '0');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('en', 'English', '0');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('th', 'Thai', '0');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('ar', 'Arabic', '1');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('zh', 'Chinese', '1');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('pt', 'Portuguese', '0');
INSERT INTO `languages` (`language_id`, `language_name`, `rtl_support`) VALUES ('ko', 'Korean', '0');
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DELETE FROM `languages` WHERE `language_id`='ar';
DELETE FROM `languages` WHERE `language_id`='de';
DELETE FROM `languages` WHERE `language_id`='en';
DELETE FROM `languages` WHERE `language_id`='es';
DELETE FROM `languages` WHERE `language_id`='fr';
DELETE FROM `languages` WHERE `language_id`='ko';
DELETE FROM `languages` WHERE `language_id`='pt';
DELETE FROM `languages` WHERE `language_id`='th';
DELETE FROM `languages` WHERE `language_id`='zh';
SQL;
        $this->execute($sql);
    }
}
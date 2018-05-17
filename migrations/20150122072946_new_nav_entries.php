<?php

use Phinx\Migration\AbstractMigration;

class NewNavEntries extends AbstractMigration
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
		$sql = "INSERT INTO navs (`key`) VALUES 
					('writeit_instruction'),
					('writeit_answer'),
					('writeit_skip'),
					('write_mistake'),
					('writeit_mistakes'),
					('writeit_skipped'),
					('writeit_tryagain'),
					('writeit_begingame'),
					('writeit_remaining'),
					('writeit_correct'),
					('writeit_incorrect'),
					('writeit_startover'),
					('writeit_perfect'),
					('writeit_previous'),
					('writeit_nummistakes'),
					('flashit_currentgame'),
					('flashit_instruction'),
					('flashit_gametype'),
					('flashit_english'),
					('flashit_mylanguage'),
					('flashit_currentscore'),
					('flashit_highscore'),
					('flashit_startagain')
				";
		$this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
		$sql = "DELETE FROM navs where `key` in (
					'writeit_instruction',
					'writeit_answer',
					'writeit_skip',
					'write_mistake',
					'writeit_mistakes',
					'writeit_skipped',
					'writeit_tryagain',
					'writeit_begingame',
					'writeit_remaining',
					'writeit_correct',
					'writeit_incorrect',
					'writeit_startover',
					'writeit_perfect',
					'writeit_previous',
					'writeit_nummistakes',
					'flashit_currentgame',
					'flashit_instruction',
					'flashit_gametype',
					'flashit_english',
					'flashit_mylanguage',
					'flashit_currentscore',
					'flashit_highscore',
					'flashit_startagain'
				)";
		$this->execute($sql);
    }
}
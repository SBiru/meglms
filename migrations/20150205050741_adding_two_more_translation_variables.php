<?php

use Phinx\Migration\AbstractMigration;

class AddingTwoMoreTranslationVariables extends AbstractMigration
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
		$variables = array('seeitandwrite','speedflash');
		$tempSql = '';
		foreach($variables as $variable){
			$tempSql .= "('{$variable}'),";
		}
		$tempSql = trim($tempSql,',');
		$sql = "INSERT INTO navs (`key`) VALUES 
					{$tempSql}
				";
		$this->execute($sql);
		unset($sql,$tempSql,$variable);
		$rows = $this->fetchAll('SELECT distinct(`language`) FROM localize_navs');
		$sql = "INSERT INTO localize_navs (`language`,`translation`,`nav_key`) VALUES ";
		foreach($rows as $row)
		{
			foreach($variables as $variable){
				$sql .= "('{$row['language']}','x','{$variable}'),";
			}
			
		}
		$sql = trim($sql,',');
		$this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
		$sql = "DELETE FROM navs where `key` in (
					'seeitandwrite',
					'speedflash'
				)";
		$this->execute($sql);
		
		$sql = "DELETE FROM localize_navs where `nav_key` in (
					'seeitandwrite',
					'speedflash'
				)";
		$this->execute($sql);
    }
}
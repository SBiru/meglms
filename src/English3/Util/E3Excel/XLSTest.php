<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.23.11
 * Time: 12:00
 */

namespace English3\Util\E3Excel;


class XLSTest {
    public function get(){
        $xlsCreator = new XLSCreator();
        $xlsCreator->setContent([
            [['value'=>'oiaaaaaaaaaaaaa']],
            [['value'=>'oiaaaaaaaaaaaaaaaaaaaaaaaaa']],
            [['value'=>'oiaaaaaaaaaaaaaaaaa']]
        ]);
        return $xlsCreator->buildFileResponse('test.xls');
    }
}
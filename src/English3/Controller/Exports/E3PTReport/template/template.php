<?php
    function printTemplate($testData){
        return
            '<body class="test-report" style="max-width: 1035px;    font-size: 12px;
    font-family: Verdana, Geneva, sans-serif;">'.
            cssRules().
            topSection($testData).
            reportDetails($testData).
            '</body>';
    }


    function topSection($testData){
        return
        '<table class="top-content margin-top-15">
            <tr>
                <td class="test-summary width-100">'.
                    userInfo($testData).
                    scoreSummary($testData).
        '       </td>
            </tr>
        </table>';
    }
    function userInfo($testData){
        return '
        <div class="student-info margin-top-15 min-width-100">
                <div class="student-name">'.$testData['name'].'</div>
                <div class="student-data font-size-15"><span> '.$testData['email'].'</span></div>
        </div>
        ';
    }
    function scoreSummary($testData){
        return '
        <div class="score-summary" style="    width: 1005px;display: block">'.
            testInfo($testData).
            scoreTable($testData).
        '</div>
        ';
    }
    function testInfo($testData){
        return '<div class="test-name"> '.$testData['testName'].' - '.$testData['submittedOn'].'</div>';
    }
    function scoreTable($testData){
        return '<table class="table" style="    width: 100%;">
            <tr class="display-grid">'.
                pgScores($testData).'
                <td class="total vr-middle">
                    <div >Total</div>
                    <div >'.$testData['actualTotalScore'].'</div>
                </td>'.
        '   </tr>
         </table>';
    }
    function pgScores($testData){
        $scores = '';
        foreach ($testData['pageGroups'] as $pg){
             $scores.= pgScore($pg);
        }
        return $scores;
    }
    function pgScore($pg){
        return '
        <td class="vr-middle">
            <div >'.$pg['name'].'</div>
            <div >'.$pg['actualScore'].'</div>
        </td>';
    }
    function reportDetails($testData){
        return
            '<div class="report-details">'.
                pgComments($testData).
                additionalComments($testData).
            '</div>';
    }
    function pgComments($testData){
        $tables = '';
        foreach ($testData['pageGroups'] as $pg){
            $tables.= pgCommentTable($pg);
        }
        return $tables;
    }
    function pgCommentTable($pg){
        if(!@$pg['area']) return '';
        return
        '<table class="table table-bordered">
            <tr >
                <th class="area width-30">
                    '.$pg['name'].' Skills
                </th>
                <th class="level width-30">Level</th>
                <th class="width-40">Comments</th>
            </tr>
            <tr>
                <td >'.$pg['area'].' 	</td>
                <td ng-bind="pg.level">'.$pg['level'].' </td>
                <td ng-bind="pg.details">'.$pg['details'].' </td>
            </tr>
        </table>';
    }
    function additionalComments($testData){
        if(!@$testData['additionalComments']) return '';
        return '
    <table class="table table-bordered"  style="margin-top: 15px">
        <tr >
            <th> Additional comments</th>
        </tr>
        <tr>
            <td>
                '.additionalCommentsPageGroups($testData).'

            </td>
        </tr>
    </table>

';
    }
    function additionalCommentsPageGroups($testData){
        $comments = '';
        foreach ($testData['additionalComments'] as $pg){
            $comments.='<p data-ng-repeat="pg in test.additionalComments">
               '.$pg['name'].': '.$pg['comments'].'
         </p>';
        }
        return $comments;
    }
function cssRules(){
    $testDashboardCss = file_get_contents($_SERVER['DOCUMENT_ROOT'].'/public/css/app/test-dashboard.css');
//        $testDashboardCss = file_get_contents($_SERVER['DOCUMENT_ROOT'].'/public/build/meglms.2018.02.08.min.css');
    $testDashboardCss.='
        .table>thead>tr>th, .table>tbody>tr>th, .table>tfoot>tr>th, .table>thead>tr>td, .table>tbody>tr>td, .table>tfoot>tr>td {
    padding: 8px;
    line-height: 1.42857143;
    vertical-align: top;
    border-top: 1px solid #ddd;
}
    table {
    border-collapse: collapse;
    border-spacing: 0;
     font-size: 12px;
     width:100%
}
        .table-bordered>thead>tr>th, .table-bordered>tbody>tr>th, .table-bordered>tfoot>tr>th, .table-bordered>thead>tr>td, .table-bordered>tbody>tr>td, .table-bordered>tfoot>tr>td {
    border: 1px solid #ddd;
}
    th{
        text-align:left
    }
';
    return '<style>'. $testDashboardCss .'</style>';
}

?>

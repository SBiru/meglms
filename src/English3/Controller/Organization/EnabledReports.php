<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 4/17/17
 * Time: 3:39 PM
 */

namespace English3\Controller\Organization;


class EnabledReports extends OrganizationPreferenceGroup
{
    protected function prepareValue($key, $value)
    {
        return boolval($value);
    }

    protected $orgFlag = 'enable_reports';
    protected $defaults = [
        'enable_report_activity'=>true,
        'enable_report_attendance'=>true,
        'enable_report_grades'=>true,
        'enable_report_progress'=>true,
        'enable_report_time_spent'=>true,
        'enable_report_grading_queue'=>true,
        'enable_report_different_pages'=>false,
        'enable_report_not_logged_in'=>false,
        'enable_report_posts_per_student'=>false,
    ];
}
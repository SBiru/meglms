<?php
/**
 * Created by IntelliJ IDEA.
 * User: Ramesh
 * Date: 2/01/18
 * Time: 7:21 PM
 */

namespace English3\Controller\Organization;


class AllowedUsersToLogInAsOthers extends OrganizationPreferenceGroup
{

    protected function prepareValue($key, $value)
    {
        return boolval($value);
    }
    protected $orgFlag = 'allow_users_to_log_in_as_others';
    protected $defaults = [
        'allow_organization_and_site_admins_to_log_in_as_others'=>false,
        'allow_teachers_to_log_in_as_others'=>false
    ];
}
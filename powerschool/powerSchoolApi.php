<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 1/28/17
 * Time: 12:10 PM
 */
//require_once("config.php");
require_once("requests.php");
require_once("oauth.php");
class powerSchoolApi
{
    private $accessToken = "";
    public function __construct() {
        $file = "token_data.json";
        $now = time();
        if(file_exists($file)) {
            $token_data = json_decode(file_get_contents($file), true);
            if (property_exists('error',$token_data)) {
                //echo $token_data['error'];
                $response = get_access_token();
                if ($response['access_token']) {
                    $this->accessToken = $response['access_token'];
                }
            }
            if (($now - $token_data['timestamp']) > intval($token_data['expires_in'])) {
                //echo "Times up";
                $response = get_access_token();
                if ($response['access_token']) {
                    $this->accessToken = $response['access_token'];
                }
            }
            else {
                $this->accessToken = $token_data['access_token'];
            }
        }
        else {
            $response = get_access_token();
            if ($response['access_token']) {
                $this->accessToken = $response['access_token'];
            }
        }
    }
    public function fetch_resource($url,$data="",$method="GET") {
        global $BASE_URL;
        $method = strtoupper($method);
        $url = $BASE_URL . $url;
        $headers = "";
        if($method == "GET") {
            $headers = array(
                'Accept:application/json',
                'Authorization:Bearer '.$this->accessToken
            );
        }
        else if($method == "POST") {
            $headers = array(
                'Content-Type:application/json',
                'Accept:application/json',
                'Authorization:Bearer '.$this->accessToken
            );
            $data = json_encode($data);
        }
        return useCurl($url,$headers,$data,$method);
    }
    public function fetch_all($url,$data,$method="GET") {
        $method = strtoupper($method);
        $url .= "?pagesize=0";
        if($method == "GET" || $method == "POST") {
            $resource = $this->fetch_resource($url, $data, $method);
            return $resource;
        }
        $error = "METHOD: ".$method." hasn't been implemented yet";
        return array("Error"=>$error);
    }

    public function get_table($table,$query,$columns) {
        $querystring = array();
        $querystring['projection'] = implode(",",$columns);
        $querystring['q'] = $query;
        $params = http_build_query($querystring);
        $url = "/ws/schema/table/{$table}/?{$params}";
        $response = $this->fetch_resource($url);
        return $response;
    }

    public function get_records($url,$altSchoolId=null,$altTermId=null) {
        require("config.php");

        $data = array();
        if($altSchoolId) $schoolids = [$altSchoolId];
        if($altTermId) $activeTermIds = [$altTermId];

        $data["schoolid"] = $schoolids;
        $data["termid"] = $activeTermIds;

        $result = json_decode($this->fetch_all($url, $data, "POST"));
        if(empty($result->record)) $result->record = [];
        return json_encode($result);
    }
    public function get_grades() {
        $url = '/ws/schema/query/org.edkey.elmsapi_v2.pgfinalgrades.getgrades';
        return $this->get_records($url);
    }
    public function get_enrollments() {
        $url = '/ws/schema/query/org.edkey.elmsapi_v2.cc.enrollments';
        return $this->get_records($url);
    }
    public function get_teachers() {
        $url = '/ws/schema/query/org.edkey.elmsapi_v2.cc.getteachers';
        return $this->get_records($url);
    }
}
/*
 *     def get_grades(self,schoolid=120,termid=2601):
        from pprint import pprint
        url = '/ws/schema/query/org.edkey.elmsapi.pgfinalgrades.getgrades'

        #catch special case with multiple terms.
        if type(termid) == list:
            data={'termid':termid[0],'schoolid':schoolid}
            # get initial term data, and concatenate the others to it.
            all_terms = self.fetch_all(url,data=data, method="POST")
            for term in termid[1:]:
                data={'termid':term,'schoolid':schoolid}
                all_terms['record'] += self.fetch_all(url,data=data, method="POST")['record']

            return all_terms

        data={'termid':termid,'schoolid':schoolid}
        return self.fetch_all(url,data=data,method="POST")
 */
/*
    def fetch_all(self,url,params={},data={},method="GET"):
        method = method.upper()
        params['pagesize'] = 0

        if method=="GET":
            response = self.fetch_resource(url,params=params)
            if not response.get('record'):
                response['record'] = []
            return response

        elif method=="POST":
            response = self.fetch_resource(url,params=params,data=data,method="POST")
            if not response.get('record'):
                response['record'] = []
            return response

        return {'error': '{} method not yet implemented'.format(method)}
 */
/*
  def fetch_resource(self,url,params={},data={},method='GET'):
        url = BASE_URL + url

        if method == 'GET':
            headers = {
                'accept': "application/json",
                'authorization': "Bearer "+self.access_token,
            }
            r = requests.get(url,headers=headers,params=params)
            try:
                return r.json()
            except ValueError:
                print(r.content)

        elif method == 'POST':
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'authorization': "Bearer "+self.access_token,
            }
            r = requests.post(url,headers=headers,params=params,data=json.dumps(data))
            try:
                return r.json()
            except ValueError:
                print(r.content)
 */
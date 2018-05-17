<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 1/28/17
 * Time: 12:10 PM
 */
require_once("config.php");
require_once("requests.php");
require_once("oauth.php");
class powerSchoolApi
{
    private $accessToken = "";
    public $data_version = null;
    public function __construct() {
        $file = "token_data.json";
        $now = time();
        if(file_exists($file)) {
            $token_data = json_decode(file_get_contents($file), true);
            if ($token_data['error']) {
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

        if(file_exists("data_version.json")) {
            $file_data = json_decode(file_get_contents("data_version.json"), true);
            $this->data_version = $file_data["data_version"];
        }

    }
    public function set_dataversion($data_version) {
        $version_file = fopen("data_version.json","w");
        $obj = new \stdClass();
        $obj->data_version = intval($data_version);
        fwrite($version_file,json_encode($obj));
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
            if (!$resource['record']) $resource['record'] = [];
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

    public function get_records($url,$params=array(),$altSchoolId=null,$altTermId=null) {
        global $schoolid;
        global $activeTermIds;

        $theSchoolId = $altSchoolId ? $altSchoolId : $schoolid;

        $data = $params;

        $data["schoolid"] = $theSchoolId;

        if($activeTermIds) {
            $termIds_copy = $activeTermIds;
            $firstTermId = array_shift($termIds_copy);
            $data["termid"] = $firstTermId;
            $init = json_decode($this->fetch_all($url,$data,"POST"));
            foreach($termIds_copy as $activeTermId) {
                $data["termid"] = $activeTermId;
                $add = json_decode($this->fetch_all($url,$data,"POST"));
                $init->record = array_merge($init->record,$add->record);
            }
            $encode = json_encode($init);
            return $encode;
        }

        global $termid;
        $theTermId = $altTermId ? $altTermId : $termid;

        $data["termid"] = $theTermId;
        $return = $this->fetch_all($url,$data,"POST");
        return $return;
    }
    public function get_grades() {
        $url = '/ws/schema/query/org.edkey.syncapi.pgfinalgrades.get_all_grades';
        return $this->get_records($url);
    }

    public function get_enrollments() {
        //check data version
        $current_version = 0;
        if(is_numeric($this->data_version)) {
            //get keys of modified records using delta pull
            $url = '/ws/dataversion/enrollment_changes/'.$this->data_version;
            $get_modified = $this->fetch_resource($url);
            $response = json_decode($get_modified,true);
            $current_version = $response["\$dataversion"];
            $tables = $response["tables"];
            $keys1 = $tables["courses"];
            $keys2 = $tables["cc"];
            $keys3 = $tables["students"];
            $keys4 = $tables["u_def_ext_students"];

            $keys_arr = array();
            $keys_arr["keys1"] = $keys1;
            $keys_arr["keys2"] = $keys2;
            $keys_arr["keys3"] = $keys3;
            $keys_arr["keys4"] = $keys4;

            //now get the records associated with the keys from before
            $url = '/ws/schema/query/org.edkey.syncapi.cc.modified_enrollments';
            $the_enrollments = $this->get_records($url,$keys_arr);
        }
        else {
            $url = '/ws/schema/query/org.edkey.syncapi.cc.all_enrollments';
            $the_enrollments = $this->get_records($url);
        }
        $this->set_dataversion($current_version);
        return $the_enrollments;
    }
    public function get_teachers() {
        $url = '/ws/schema/query/org.edkey.syncapi.cc.getteachers';
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
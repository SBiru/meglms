import requests
import sys
username = 'mikegriffiths11@hotmail.com'
password = 'aloha123'
baseUrl = 'http://safebuilt.seagage.com/'


class Api:
    def __init__(self):
        self.cookie = None
        self.login()

    def login(self):
        payload = {'username':username,'password':password}
        s = self.post('signin/',payload)
        cookie = {'PHPSESSID': requests.utils.dict_from_cookiejar(s.cookies)['PHPSESSID']}
        self.cookie = cookie

    def post(self,url,data):
        with requests.Session() as s:
            s.post(baseUrl + url,data=data,cookies=self.cookie)
            return s


    def get(self,url):
        r = requests.get(baseUrl + url,cookies=self.cookie)
        if r.status_code != 200:
            print 'error'
            sys.exit()
        else:
            return r


def main():
    api = Api()
    organizations = api.get('organization/me').json()
    for o in organizations.organizations:
        departments = api.get('api/organizations/' + o.id + '/departments').json()
        payload = {'recalculateAll':True}
        for d in departments:
            api.post('api/reports/dept/' + d['id'],data=payload)


main()


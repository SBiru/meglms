# cron job:
#		59 23 * * * /script_location.sh
# i.e:
#		59 23 * * * /var/www/src/English3/Bin/update_reports.sh
# will execute every day at 23:59 hrs
curl --request PUT 'http://localhost/api/reports'

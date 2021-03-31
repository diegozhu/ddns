@echo off
node ddns.js %~1 %~2 %~3 >> %userprofile%\ddnsLog.log 2>>%userprofile%\ddnsErrorLog.log
echo. >> %userprofile%\ddnsLog.log
echo. >> %userprofile%\ddnsLog.log
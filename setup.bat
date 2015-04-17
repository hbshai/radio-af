cd ..

start "phonegap setup" /W phonegap create -n "Radio AF" -i "se.designbyshai.radioaf" radio-af-app

cd radio-af-app

rmdir www /s /q

mklink /j "www" ..\radio-af\www

start "plugin-1" /W cordova plugin add org.apache.cordova.file
start "plugin-2" /W cordova plugin add org.apache.cordova.media
start "plugin-3" /W cordova plugin add https://github.com/Telerik-Verified-Plugins/NativePageTransitions


phonegap serve
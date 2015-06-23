cd ..

start "phonegap setup" /W phonegap create -n "Radio AF" -i "se.designbyshai.radioaf" radio-af-app

cd radio-af-app

rmdir www /s /q

mklink /j "www" ..\radio-af\www
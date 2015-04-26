npm install gulp
npm intall gulp-less
npm intall gulp-concat
npm intall gulp-jade
npm install del


cd ..

start "phonegap setup" /W phonegap create -n "Radio AF" -i "se.designbyshai.radioaf" radio-af-app

cd radio-af-app

rmdir www /s /q

mklink /j "www" ..\radio-af\www

start "plugin-1" /W cordova plugin add org.apache.cordova.file
start "plugin-2" /W cordova plugin add org.apache.cordova.media

echo "phonegap serve"
npm install gulp

cd ..

phonegap create -n "Radio AF" -i "se.designbyshai.radioaf" radio-af-app
cd radio-af-app

rm -rf ./www

ln -s ../radio-af ./www

cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
cordova plugin add https://github.com/Telerik-Verified-Plugins/NativePageTransitions

echo "phonegap serve"

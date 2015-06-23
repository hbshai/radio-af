cd ..

phonegap create -n "Radio AF" -i "se.designbyshai.radioaf" radio-af-app
cd radio-af-app

rm -rf ./www

ln -s ../radio-af ./www

radio af
--------
Cordova-powered podcast subscriber and player. Works on iOS and Android.

requirements
------------
 - node js & npm
 - cordova: `npm install -g cordova`
 - phonegap: `npm install -g phonegap`

cordova plugins
---------------
The application requires some Cordova plugins, specifically:
 ```
 cordova plugin add cordova-plugin-device 
 cordova plugin add cordova-plugin-dialogs 
 cordova plugin add cordova-plugin-file-transfer 
 cordova plugin add cordova-plugin-media 
 cordova plugin add cordova-plugin-network-information 
 cordova plugin add https://github.com/MobileChromeApps/cordova-plugin-okhttp.git
 cordova plugin add cordova-plugin-splashscreen 
 cordova plugin add cordova-plugin-whitelist 
 ```

getting started
---------------
 - install phonegap & cordova
 - git clone into `radio-af`
 - `npm install`
 - run `setup.bat` or `setup.sh` to generate radio-af-app folder and symlink www dir
 - either use Phonegap Developer App, or build manually for a platform

example config.xml
------------------
```
<?xml version='1.0' encoding='utf-8'?>
<widget 
    id="se.designbyshai.radioaf" 
    version="1.0.0" 
    xmlns="http://www.w3.org/ns/widgets" 
    xmlns:gap="http://phonegap.com/ns/1.0"
    xmlns:android="http://schemas.android.com/apk/res/android">
    <name>Radio AF</name>
    <description>
        Podcast subscriber and player for Radio AF.
    </description>
    <author email="hbshai@sent.com" href="http://designbyshai.se">
        shai
    </author>
    <content src="index.html" />
    <preference name="Orientation" value="portrait" />

    <preference name="permissions" value="all" />
    <preference name="target-device" value="universal" />
    <preference name="fullscreen" value="false" />
    <preference name="webviewbounce" value="false" />
    <preference name="prerendered-icon" value="true" />
    <preference name="stay-in-webview" value="false" />
    <preference name="ios-statusbarstyle" value="black-opaque" />

    <preference name="detect-data-types" value="true" />
    <preference name="exit-on-suspend" value="false" />
    <preference name="show-splash-screen-spinner" value="false" />
    <preference name="auto-hide-splash-screen" value="false" />
    <preference name="disable-cursor" value="false" />
    <preference name="android-minSdkVersion" value="19" />
    <preference name="android-installLocation" value="auto" />
    
    <splash src="www/res/splash.9.png" />
    <preference name="SplashScreen" value="splash" />
    
    <access origin="*"/>
    <allow-intent href="*"/>
    <allow-navigation href="*"/>

    <platform name="android">
        <icon density="ldpi" src="www/res/icon/android/icon-36-ldpi.png" />
        <icon density="mdpi" src="www/res/icon/android/icon-48-mdpi.png" />
        <icon density="hdpi" src="www/res/icon/android/icon-72-hdpi.png" />
        <icon density="xhdpi" src="www/res/icon/android/icon-96-xhdpi.png" />
        <icon density="xxhdpi" src="www/res/icon/android/icon-144-xxhdpi.png" />
        <icon density="xxxhdpi" src="www/res/icon/android/icon-192-xxxhdpi.png" />

        <preference name="DefaultVolumeStream" value="media"/>
    </platform>

    <platform name="ios">
        <preference name="BackupWebStorage" value="none"/>

        <icon height="57" src="www/res/icon/ios/icon-57.png" width="57" />
        <icon height="72" src="www/res/icon/ios/icon-72.png" width="72" />
        <icon height="76" src="www/res/icon/ios/icon-76.png" width="76" />
        <icon height="114" src="www/res/icon/ios/icon-57-2x.png" width="114" />
        <icon height="144" src="www/res/icon/ios/icon-72-2x.png" width="144" />
        <icon height="152" src="www/res/icon/ios/icon-76-2x.png" width="152" />
        <icon height="120" src="www/res/icon/ios/icon-60-2x.png" width="120" />

        <splash src="www/res/screen/ios/screen-iphone-portrait.png" width="320" height="480" />
        <splash src="www/res/screen/ios/screen-iphone-portrait-2x.png" height="960" width="640" />
        <splash src="www/res/screen/ios/screen-iphone-portrait-568h-2x.png" height="1136" width="640" />
        <splash src="www/res/screen/ios/screen-ipad-portrait.png" width="768" height="1024" />
        <splash src="www/res/screen/ios/Default-667h.png" width="750" height="1334"/>
        <splash src="www/res/screen/ios/Default-736h.png" width="1242" height="2208"/>
        <splash src="www/res/screen/ios/Default-Portrait@2x~ipad.png" width="1536" height="2048"/>
    </platform>
</widget>

```

copyright
---------
Included work are copyrighted by their respective authors.

license / legal
----------------
handelsbolaget shai retains all rights to the Software.

handelsbolaget shai has granted Radio AF the right to modify the Software and distribute binaries on Apple Inc's App Store(tm) and Google Inc's Google Play Store(tm).

THIS SOFTWARE IS PROVIDED BY handelsbolaget shai ''AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL handelsbolaget shai BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE
set -e
export JAVA_HOME=/opt/android/jdk ANDROID_HOME=/opt/android/sdk PATH=/opt/android/jdk/bin:$PATH CI=1
APP=$1; cd /workspace/porur-native/apps/$APP
[ -d android ] || npx expo prebuild -p android --clean --no-install
cd android
sed -i 's/^reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/' gradle.properties
sed -i 's/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=768m/' gradle.properties
grep -q kotlin.compiler.execution gradle.properties || printf "\n" >> gradle.properties; grep -q kotlin.compiler.execution gradle.properties || echo "kotlin.compiler.execution.strategy=in-process" >> gradle.properties
echo "sdk.dir=/opt/android/sdk" > local.properties
./gradlew assembleRelease --no-daemon --max-workers=2 -q
mkdir -p /workspace/porur-native/apk && cp app/build/outputs/apk/release/app-release.apk /workspace/porur-native/apk/porur-$APP.apk
echo APK_DONE_$APP

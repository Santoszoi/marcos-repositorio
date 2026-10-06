import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
test('preparação nativa preserva Dart e configura biometria, TLS debug e Keychain', t => {
  const root = mkdtempSync(join(tmpdir(), 'native-config-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const project = join(root, 'project'); mkdirSync(join(project, 'scripts'), {recursive: true}); mkdirSync(join(project, 'app'), {recursive: true});
  cpSync(join(dirname(fileURLToPath(import.meta.url)), 'prepare.mjs'), join(project, 'scripts/prepare.mjs'));
  writeFileSync(join(project, 'app', 'marker.dart'), 'keep me');
  const bin = join(root, 'bin'); mkdirSync(bin);
  writeFileSync(join(bin, 'flutter'), `#!/usr/bin/env node
const fs=require('fs');const path=require('path');const args=process.argv.slice(2);
if(args[0]==='create') {
  const dst=args.at(-1);
  const put=(name,content)=>{const p=path.join(dst,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content);};
  put('android/app/build.gradle.kts','minSdk = flutter.minSdkVersion');
  put('android/app/src/main/AndroidManifest.xml','<manifest><application android:label="secure_biometric_app"></application></manifest>');
  put('android/app/src/main/res/values/styles.xml','parent="@android:style/Theme.Light.NoTitleBar"');
  put('android/app/src/main/res/values-night/styles.xml','parent="@android:style/Theme.Black.NoTitleBar"');
  put('ios/Runner/Info.plist','<plist><dict><key>CFBundleDisplayName</key><string>Secure Biometric App</string>\\n</dict>\\n</plist>');
  put('ios/Runner.xcodeproj/project.pbxproj','IPHONEOS_DEPLOYMENT_TARGET = 13.0;\\nPRODUCT_BUNDLE_IDENTIFIER = com.marcossolutions.secureBiometricApp;');
  put('ios/Podfile',"# platform :ios, '13.0'");
}
`, {mode: 0o755});
  const result = spawnSync(process.execPath, [join(project, 'scripts/prepare.mjs')], {env: {...process.env, PATH: bin + ':' + process.env.PATH}, encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const file = name => readFileSync(join(project, 'app', name), 'utf8');
  assert.equal(file('marker.dart'), 'keep me');
  assert.match(file('android/app/build.gradle.kts'), /minSdk = 24/);
  assert.match(file('android/app/src/main/AndroidManifest.xml'), /USE_BIOMETRIC/);
  assert.match(file('android/app/src/main/AndroidManifest.xml'), /allowBackup="false"/);
  assert.doesNotMatch(file('android/app/src/main/AndroidManifest.xml'), /usesCleartextTraffic/);
  assert.match(file('android/app/src/debug/AndroidManifest.xml'), /usesCleartextTraffic="true"/);
  assert.match(file('android/app/src/main/res/values/styles.xml'), /Theme.AppCompat/);
  assert.match(file('android/app/src/main/kotlin/com/marcossolutions/secure_biometric_app/MainActivity.kt'), /FlutterFragmentActivity/);
  assert.match(file('ios/Runner/Info.plist'), /NSFaceIDUsageDescription/);
  assert.match(file('ios/Runner.xcodeproj/project.pbxproj'), /CODE_SIGN_ENTITLEMENTS = Runner\/Runner.entitlements/);
  assert.match(file('ios/Runner/Runner.entitlements'), /AppIdentifierPrefix\)com.marcossolutions.secureBiometricApp/);
  const again = spawnSync(process.execPath, [join(project, 'scripts/prepare.mjs')], {env: {...process.env, PATH: bin + ':' + process.env.PATH}, encoding: 'utf8'});
  assert.equal(again.status, 0, again.stderr);
  assert.equal((file('android/app/src/main/AndroidManifest.xml').match(/USE_BIOMETRIC/g) || []).length, 1);
});

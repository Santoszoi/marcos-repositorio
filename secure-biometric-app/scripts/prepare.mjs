// Generate the official Flutter native projects without overwriting application sources.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'app');
const temporary = mkdtempSync(join(tmpdir(), 'marcos-secure-'));
const binary = process.platform === 'win32' ? 'flutter.bat' : 'flutter';
function run(args, cwd) {
  const result = spawnSync(binary, args, {cwd, stdio: 'inherit', shell: process.platform === 'win32'});
  if (result.error || result.status !== 0) throw new Error('Instale o Flutter SDK e confira flutter doctor.');
}
const edit = (path, callback) => writeFileSync(path, callback(readFileSync(path, 'utf8')));
try {
  const generated = join(temporary, 'secure_biometric_app');
  run(['create', '--no-pub', '--platforms=android,ios', '--org', 'com.marcossolutions', '--project-name', 'secure_biometric_app', generated], root);
  for (const directory of ['android', 'ios']) {
    const destination = join(app, directory);
    if (!existsSync(destination)) cpSync(join(generated, directory), destination, {recursive: true});
  }
  // Configure Kotlin activity and themes for Android's biometric prompt.
  const kotlin = join(app, 'android/app/src/main/kotlin/com/marcossolutions/secure_biometric_app/MainActivity.kt');
  mkdirSync(dirname(kotlin), {recursive: true});
  writeFileSync(kotlin, 'package com.marcossolutions.secure_biometric_app\n\nimport io.flutter.embedding.android.FlutterFragmentActivity\n\nclass MainActivity : FlutterFragmentActivity()\n');
  const main = join(app, 'android/app/src/main');
  edit(join(main, 'AndroidManifest.xml'), text => {
    if (!text.includes('android.permission.INTERNET')) text = text.replace('<application', '<uses-permission android:name="android.permission.INTERNET"/>\n    <application');
    if (!text.includes('android.permission.USE_BIOMETRIC')) text = text.replace('<application', '<uses-permission android:name="android.permission.USE_BIOMETRIC"/>\n    <application');
    if (!text.includes('android.permission.USE_FINGERPRINT')) text = text.replace('<application', '<uses-permission android:name="android.permission.USE_FINGERPRINT"/>\n    <application');
    if (!text.includes('android:allowBackup')) text = text.replace('<application', '<application android:allowBackup="false"');
    return text.replace(/android:label="[^"]+"/, 'android:label="Marcos Secure"');
  });
  for (const values of readdirSync(join(main, 'res')).filter(value => value.startsWith('values'))) {
    const styles = join(main, 'res', values, 'styles.xml');
    if (existsSync(styles)) edit(styles, text => text.replace(/@android:style\/Theme\.\w+\.NoTitleBar/g, 'Theme.AppCompat.DayNight.NoActionBar'));
  }
  const gradle = join(app, 'android/app/build.gradle.kts');
  if (!existsSync(gradle)) throw new Error('Use Flutter 3.38+ com o modelo Gradle Kotlin.');
  edit(gradle, text => text.replace(/minSdk\s*=\s*(?:flutter.minSdkVersion|\d+)/, 'minSdk = 24'));
  // HTTP is permitted only in a debug manifest. Release always requires TLS.
  const debug = join(app, 'android/app/src/debug/AndroidManifest.xml');
  mkdirSync(dirname(debug), {recursive: true});
  writeFileSync(debug, '<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n<uses-permission android:name="android.permission.INTERNET"/>\n<application android:usesCleartextTraffic="true"/>\n</manifest>\n');
  edit(join(app, 'ios/Runner/Info.plist'), text => {
    if (!text.includes('NSFaceIDUsageDescription')) text = text.replace('</dict>\n</plist>', '<key>NSFaceIDUsageDescription</key>\n<string>Use o Face ID para proteger o acesso à sua conta.</string>\n<key>NSLocalNetworkUsageDescription</key>\n<string>Conectar ao servidor durante testes locais.</string>\n</dict>\n</plist>');
    return text.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]+/, '$1Marcos Secure');
  });
  const entitlements = join(app, 'ios/Runner/Runner.entitlements');
  writeFileSync(entitlements, '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>keychain-access-groups</key><array><string>$(AppIdentifierPrefix)com.marcossolutions.secure_biometric_app</string></array></dict></plist>\n');
  edit(join(app, 'ios/Runner.xcodeproj/project.pbxproj'), text => {
    text = text.replace(/IPHONEOS_DEPLOYMENT_TARGET = [\d.]+;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 13.0;');
    if (!text.includes('CODE_SIGN_ENTITLEMENTS = Runner/Runner.entitlements;')) text = text.replace(/(PRODUCT_BUNDLE_IDENTIFIER = com\.marcossolutions\.[^;]+;)/g, 'CODE_SIGN_ENTITLEMENTS = Runner/Runner.entitlements;\n\t\t\t\t$1');
    return text;
  });
  // Keep entitlements aligned with the generated Runner bundle ID.
  const project = readFileSync(join(app, 'ios/Runner.xcodeproj/project.pbxproj'), 'utf8');
  const bundle = [...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map(match => match[1]).find(value => !value.endsWith('RunnerTests'));
  if (!bundle) throw new Error('Não foi possível localizar o bundle ID do iOS.');
  edit(entitlements, text => text.replace('com.marcossolutions.secure_biometric_app', bundle));
  const podfile = join(app, 'ios/Podfile');
  if (existsSync(podfile)) edit(podfile, text => text.replace(/^#?\s*platform :ios, '[^']+'/m, "platform :ios, '13.0'"));
  run(['pub', 'get'], app);
  console.info('Android e iOS preparados. Consulte README.md para executar.');
} finally { rmSync(temporary, {recursive: true, force: true}); }

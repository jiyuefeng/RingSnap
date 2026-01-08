/**
 * 版本同步脚本
 * 将 package.json 中的版本号同步到 tauri.conf.json
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 package.json 的版本号
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
const version = packageJson.version;

// 更新 tauri.conf.json
const tauriConfigPath = join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'));

const oldVersion = tauriConfig.package.version;
tauriConfig.package.version = version;

writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');

console.log(`✅ 版本同步完成: ${oldVersion} → ${version}`);
console.log(`   - package.json: ${version}`);
console.log(`   - tauri.conf.json: ${version}`);

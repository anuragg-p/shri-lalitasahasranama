import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Starting pipeline...\n');

const scripts = [
  {
    name: 'Convert Commentaries to JSON',
    script: 'convert-commentaries-to-json.js',
  },
  {
    name: 'Convert Sanskrit',
    script: 'convert-sanskrit.js',
  },
  {
    name: 'Convert to Names',
    script: 'convert-to-names.js',
  },
  {
    name: 'Parse Verses',
    script: 'parse-verses.js',
  },
];

try {
  for (const { name, script } of scripts) {
    console.log(`\n📝 Running: ${name}`);
    console.log(`   Script: ${script}\n`);
    
    try {
      execSync(`node ${path.join(__dirname, script)}`, {
        stdio: 'inherit',
        cwd: projectRoot,
      });
      console.log(`✅ ${name} completed successfully\n`);
    } catch (error) {
      console.error(`❌ Error in ${name}:`, error.message);
      process.exitCode = 1;
      throw error;
    }
  }
  
  console.log('\n🎉 Pipeline completed successfully!');
} catch (error) {
  console.error('\n💥 Pipeline failed:', error.message);
  process.exit(1);
}


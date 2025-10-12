#!/usr/bin/env node

/**
 * Automatically fix certificate formatting in .env file
 * Converts multiline certificates to single-line format with \n
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔧 Auto-fixing certificate format in .env file...\n');

try {
    const envPath = join(rootDir, '.env');
    const backupPath = join(rootDir, '.env.backup');
    
    // Backup original .env
    copyFileSync(envPath, backupPath);
    console.log('✅ Backup created: .env.backup\n');
    
    // Read current .env
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let newEnvLines = [];
    let currentKey = '';
    let currentValue = '';
    let inCert = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('SSL_KEY_DATA=') || line.startsWith('SSL_CERT_DATA=')) {
            // Save previous cert if any
            if (inCert && currentKey) {
                // Convert to single line with \n
                const formattedValue = currentValue.replace(/\n/g, '\\n');
                newEnvLines.push(`${currentKey}="${formattedValue}"`);
            }
            
            // Start new cert
            const parts = line.split('=');
            currentKey = parts[0];
            currentValue = parts.slice(1).join('=').replace(/^["']|["']$/g, '');
            inCert = true;
        } else if (inCert && line && !line.startsWith('USE_HTTPS') && !line.includes('=')) {
            // Continue multiline cert
            currentValue += '\n' + line;
        } else {
            // Save previous cert if any
            if (inCert && currentKey) {
                const formattedValue = currentValue.replace(/\n/g, '\\n');
                newEnvLines.push(`${currentKey}="${formattedValue}"`);
                currentKey = '';
                currentValue = '';
                inCert = false;
            }
            
            // Add non-cert line (skip USE_HTTPS, we'll add it at the top)
            if (!line.startsWith('USE_HTTPS') && line) {
                newEnvLines.push(line);
            }
        }
    }
    
    // Save last cert if any
    if (inCert && currentKey) {
        const formattedValue = currentValue.replace(/\n/g, '\\n');
        newEnvLines.push(`${currentKey}="${formattedValue}"`);
    }
    
    // Build new .env content
    let newEnvContent = 'USE_HTTPS=true\n\n';
    
    // Add all non-SSL lines first
    const nonSslLines = newEnvLines.filter(l => !l.startsWith('SSL_'));
    if (nonSslLines.length > 0) {
        newEnvContent += nonSslLines.join('\n') + '\n\n';
    }
    
    // Add SSL lines
    const sslLines = newEnvLines.filter(l => l.startsWith('SSL_'));
    if (sslLines.length > 0) {
        newEnvContent += sslLines.join('\n') + '\n';
    }
    
    // Write new .env
    writeFileSync(envPath, newEnvContent);
    
    console.log('✅ Certificate format fixed!\n');
    console.log('Changes made:');
    console.log('  • Added USE_HTTPS=true');
    console.log('  • Converted multiline certificates to single-line format');
    console.log('  • Added proper \\n escape sequences\n');
    console.log('🚀 Your server is now ready to run with HTTPS!');
    console.log('   Run: npm start\n');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nIf something went wrong, restore from backup:');
    console.error('  cp .env.backup .env');
    process.exit(1);
}

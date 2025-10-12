#!/usr/bin/env node

/**
 * Script to format certificate data for .env file
 * Reads current .env, extracts and properly formats SSL certificates
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔧 Formatting certificates for .env file...\n');

try {
    // Read current .env
    const envPath = join(rootDir, '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let keyData = '';
    let certData = '';
    let inKeyData = false;
    let inCertData = false;
    let otherLines = [];
    
    // Parse the .env file
    for (const line of lines) {
        if (line.startsWith('SSL_KEY_DATA=')) {
            inKeyData = true;
            inCertData = false;
            keyData = line.replace('SSL_KEY_DATA=', '').replace(/^["']|["']$/g, '');
        } else if (line.startsWith('SSL_CERT_DATA=')) {
            inCertData = true;
            inKeyData = false;
            certData = line.replace('SSL_CERT_DATA=', '').replace(/^["']|["']$/g, '');
        } else if (line.startsWith('USE_HTTPS=')) {
            // Skip, we'll add it back
            continue;
        } else if (inKeyData && line.trim()) {
            keyData += line.trim();
        } else if (inCertData && line.trim()) {
            certData += line.trim();
        } else if (!line.startsWith('SSL_') && line.trim() !== '') {
            inKeyData = false;
            inCertData = false;
            otherLines.push(line);
        }
    }
    
    console.log('📋 Current certificate status:');
    console.log(`   SSL_KEY_DATA length: ${keyData.length} characters`);
    console.log(`   SSL_CERT_DATA length: ${certData.length} characters`);
    console.log('');
    
    if (keyData.length === 0 || certData.length === 0) {
        console.log('❌ Error: Certificate data not found in .env file');
        console.log('');
        console.log('Please add your certificates in this format:');
        console.log('');
        console.log('SSL_KEY_DATA="-----BEGIN PRIVATE KEY-----\\nYourKeyHere\\n-----END PRIVATE KEY-----\\n"');
        console.log('SSL_CERT_DATA="-----BEGIN CERTIFICATE-----\\nYourCertHere\\n-----END CERTIFICATE-----\\n"');
        process.exit(1);
    }
    
    // Check if already properly formatted (contains \n)
    const hasNewlines = keyData.includes('\\n') && certData.includes('\\n');
    
    if (hasNewlines) {
        console.log('✅ Certificates are already properly formatted!');
        console.log('');
        
        // Just make sure USE_HTTPS=true is present
        if (!envContent.includes('USE_HTTPS=true')) {
            console.log('Adding USE_HTTPS=true to .env...');
            const newContent = 'USE_HTTPS=true\n' + envContent;
            writeFileSync(envPath, newContent);
            console.log('✅ Added USE_HTTPS=true to .env');
        } else {
            console.log('✅ USE_HTTPS=true is already set');
        }
    } else {
        console.log('⚠️  Certificates need formatting.');
        console.log('');
        console.log('Your certificates appear to be multiline or improperly formatted.');
        console.log('They need to be on a single line with \\n representing line breaks.');
        console.log('');
        console.log('Example format:');
        console.log('SSL_KEY_DATA="-----BEGIN PRIVATE KEY-----\\nMIIEvgIB...\\n-----END PRIVATE KEY-----\\n"');
    }
    
    console.log('');
    console.log('📝 To enable HTTPS, ensure your .env has:');
    console.log('   1. USE_HTTPS=true');
    console.log('   2. SSL_KEY_DATA with proper \\n line breaks');
    console.log('   3. SSL_CERT_DATA with proper \\n line breaks');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

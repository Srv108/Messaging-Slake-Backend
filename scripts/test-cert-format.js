#!/usr/bin/env node

/**
 * Test if certificates can be loaded by Node.js
 */

import { createServer } from 'https';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing certificate format...\n');

const SSL_KEY_DATA = process.env.SSL_KEY_DATA;
const SSL_CERT_DATA = process.env.SSL_CERT_DATA;

if (!SSL_KEY_DATA || !SSL_CERT_DATA) {
    console.log('❌ SSL_KEY_DATA or SSL_CERT_DATA not found in .env');
    process.exit(1);
}

console.log(`📋 Certificate data found:`);
console.log(`   Key length: ${SSL_KEY_DATA.length} characters`);
console.log(`   Cert length: ${SSL_CERT_DATA.length} characters\n`);

// Convert \n to actual newlines
const key = SSL_KEY_DATA.replace(/\\n/g, '\n');
const cert = SSL_CERT_DATA.replace(/\\n/g, '\n');

console.log('🔍 Key preview (first 100 chars):');
console.log(key.substring(0, 100) + '...\n');

console.log('🔍 Cert preview (first 100 chars):');
console.log(cert.substring(0, 100) + '...\n');

try {
    console.log('🔧 Attempting to create HTTPS server...');
    const options = { key, cert };
    const server = createServer(options, (req, res) => {
        res.writeHead(200);
        res.end('Test');
    });
    
    console.log('✅ HTTPS server created successfully!');
    console.log('✅ Certificates are valid and properly formatted!\n');
    console.log('🎉 Your HTTPS configuration is working correctly!');
    
    server.close();
    process.exit(0);
} catch (error) {
    console.log('❌ Failed to create HTTPS server\n');
    console.log('Error details:');
    console.log(`   Message: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}\n`);
    
    if (error.message.includes('DECODER') || error.message.includes('unsupported')) {
        console.log('💡 Possible causes:');
        console.log('   • Certificate is encrypted (needs passphrase)');
        console.log('   • Certificate format is not supported');
        console.log('   • Certificate file is corrupted\n');
        console.log('💡 Solutions:');
        console.log('   1. Generate new unencrypted certificates');
        console.log('   2. Convert existing certificates to PEM format');
        console.log('   3. Remove passphrase from private key\n');
    }
    
    process.exit(1);
}

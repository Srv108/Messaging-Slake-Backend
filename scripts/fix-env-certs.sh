#!/bin/bash

# Script to fix certificate format in .env file
# This will backup your current .env and create a properly formatted version

echo "🔧 Fixing certificate format in .env file..."
echo ""

# Backup current .env
cp .env .env.backup
echo "✅ Backup created: .env.backup"

# Extract current SSL_KEY_DATA and SSL_CERT_DATA (if they exist as multiline)
# and convert them to single-line format with \n

# Create a temporary file with the fixed format
grep -v "^SSL_KEY_DATA=" .env | grep -v "^SSL_CERT_DATA=" | grep -v "^USE_HTTPS=" > .env.tmp

# Add USE_HTTPS=true at the top
echo "USE_HTTPS=true" >> .env.tmp
echo "" >> .env.tmp

# Get the certificate data from backup and format it
echo "🔄 Formatting certificates..."

# Check if certificates exist in backup
if grep -q "SSL_KEY_DATA" .env.backup && grep -q "SSL_CERT_DATA" .env.backup; then
    echo "⚠️  Found existing certificate data, but it needs manual formatting."
    echo ""
    echo "Please format your certificates like this:"
    echo ""
    echo 'SSL_KEY_DATA="-----BEGIN PRIVATE KEY-----\nYourKeyDataHere\n-----END PRIVATE KEY-----\n"'
    echo 'SSL_CERT_DATA="-----BEGIN CERTIFICATE-----\nYourCertDataHere\n-----END CERTIFICATE-----\n"'
    echo ""
    echo "The entire certificate must be on ONE line with \\n representing line breaks."
else
    echo "ℹ️  No existing certificate data found."
fi

# Restore the temp file
mv .env.tmp .env.temp
echo ""
echo "✅ Created .env.temp with USE_HTTPS=true"
echo ""
echo "Next steps:"
echo "1. Add your properly formatted SSL_KEY_DATA and SSL_CERT_DATA to .env"
echo "2. Make sure each certificate is on a single line with \\n for line breaks"
echo "3. Wrap the certificate data in double quotes"

#!/bin/bash

# Script to create properly formatted inline certificate data for .env
# This creates the exact format needed for SSL_KEY_DATA and SSL_CERT_DATA

echo "🔧 Creating inline certificate data for .env..."
echo ""

if [ ! -f "src/certs/key.pem" ] || [ ! -f "src/certs/cert.pem" ]; then
    echo "❌ Certificate files not found in src/certs/"
    exit 1
fi

echo "✅ Certificate files found"
echo ""
echo "=================================================="
echo "Add these lines to your .env file:"
echo "=================================================="
echo ""
echo "USE_HTTPS=true"
echo ""

# Convert key to single line with proper escaping
echo -n 'SSL_KEY_DATA="'
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' src/certs/key.pem | sed 's/$//'
echo '"'
echo ""

# Convert cert to single line with proper escaping  
echo -n 'SSL_CERT_DATA="'
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' src/certs/cert.pem | sed 's/$//'
echo '"'
echo ""
echo "=================================================="
echo ""
echo "✅ Copy the above to your .env file"
echo ""
echo "Note: Each certificate must be:"
echo "  • On a SINGLE line"
echo "  • Wrapped in double quotes"
echo "  • Using \\n (backslash-n) for line breaks"

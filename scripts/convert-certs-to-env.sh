#!/bin/bash

# Script to convert SSL certificate files to .env format
# Usage: ./scripts/convert-certs-to-env.sh

echo "Converting SSL certificates to .env format..."
echo ""

# Check if certificate files exist
if [ ! -f "src/certs/key.pem" ]; then
    echo "❌ Error: src/certs/key.pem not found"
    exit 1
fi

if [ ! -f "src/certs/cert.pem" ]; then
    echo "❌ Error: src/certs/cert.pem not found"
    exit 1
fi

echo "✅ Certificate files found"
echo ""
echo "Add these lines to your .env file:"
echo "=================================================="
echo ""
echo "USE_HTTPS=true"
echo ""

# Convert private key
echo -n 'SSL_KEY_DATA="'
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' src/certs/key.pem
echo '"'
echo ""

# Convert certificate
echo -n 'SSL_CERT_DATA="'
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' src/certs/cert.pem
echo '"'
echo ""
echo "=================================================="
echo ""
echo "✅ Done! Copy the above lines to your .env file"

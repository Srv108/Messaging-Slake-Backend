# HTTPS/WSS Configuration Guide

## Current Setup

Your server is now configured to support **HTTPS** and **Secure WebSocket (WSS)** connections with **two methods**:

1. **Inline Certificate Data** (Recommended for deployment) - Store certificates directly in `.env`
2. **Certificate Files** (Good for local development) - Use certificate files from `src/certs/`

## Method 1: Inline Certificate Data (Recommended)

Store your certificates directly in the `.env` file. This is ideal for:
- Cloud deployments (Heroku, Vercel, Railway, etc.)
- Docker containers
- CI/CD pipelines
- Environments where file management is difficult

### Setup

1. Convert your certificate files to single-line format:
```bash
# For the private key
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' src/certs/key.pem

# For the certificate
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' src/certs/cert.pem
```

2. Add to your `.env` file:
```env
USE_HTTPS=true
SSL_KEY_DATA="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
SSL_CERT_DATA="-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAKL0UG+mRKSzMA0GCSqGSIb3DQEBBQUA...\n-----END CERTIFICATE-----\n"
```

**Note**: The entire certificate must be on a single line with `\n` representing line breaks.

## Method 2: Certificate Files

Use certificate files from the filesystem. This is the default for local development.

### Default Location
The server automatically looks for certificates in:
- **Key**: `src/certs/key.pem`
- **Certificate**: `src/certs/cert.pem`

### Setup

Add to your `.env` file:
```env
USE_HTTPS=true
```

That's it! The server will automatically use the certificates in `src/certs/`.

### Custom Certificate Paths (Optional)

If you want to use certificates from a different location:

```env
USE_HTTPS=true
SSL_KEY_PATH=/custom/path/to/privkey.pem
SSL_CERT_PATH=/custom/path/to/fullchain.pem
```

## How It Works

### Priority Order
The server checks for certificates in this order:
1. **Inline data** (`SSL_KEY_DATA` and `SSL_CERT_DATA`) - Highest priority
2. **File paths** (`SSL_KEY_PATH` and `SSL_CERT_PATH`) - Fallback
3. **Default files** (`src/certs/key.pem` and `src/certs/cert.pem`) - Final fallback

### Server Modes

1. **HTTPS Enabled** (`USE_HTTPS=true`):
   - Server runs on `https://localhost:PORT`
   - Socket.IO uses secure WebSocket (`wss://`)
   - Certificates loaded from inline data or files

2. **HTTPS Disabled** (default):
   - Server runs on `http://localhost:PORT`
   - Socket.IO uses standard WebSocket (`ws://`)
   - No certificates needed

## Error Handling

The server includes automatic fallback:
- ✅ If certificates are found → HTTPS server starts
- ⚠️ If certificates are missing → Falls back to HTTP with warning
- ❌ If certificates are invalid → Falls back to HTTP with error message

## Startup Logs

When using inline certificate data:
```
✅ HTTPS server created with inline SSL certificate data from .env
```

When using certificate files:
```
✅ HTTPS server created with SSL certificate files
   Key: /path/to/key.pem
   Cert: /path/to/cert.pem
```

When running HTTP:
```
ℹ️  Running HTTP server (non-secure)
   To enable HTTPS, set USE_HTTPS=true in .env file
```

## Production Recommendations

For production, use certificates from a trusted Certificate Authority (CA):
- **Let's Encrypt** (free, automated)
- **Commercial CA** (paid, extended validation)

Self-signed certificates (like the ones in `src/certs/`) will show browser warnings in production.

#!/bin/bash
# 生成自签名 SSL 证书（仅用于开发/测试，生产环境请使用 Let's Encrypt 或商业证书）
# 使用方法: bash scripts/generate-ssl.sh

set -e

SSL_DIR="$(dirname "$0")/../frontend/ssl"
mkdir -p "$SSL_DIR"

echo "🔐 Generating self-signed SSL certificate..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/key.pem" \
  -out "$SSL_DIR/cert.pem" \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=AI-Customer-Acquisition/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✅ SSL certificate generated:"
echo "   Certificate: $SSL_DIR/cert.pem"
echo "   Private Key: $SSL_DIR/key.pem"
echo ""
echo "⚠️  This is a self-signed certificate for development only."
echo "   For production, use Let's Encrypt or a commercial CA."

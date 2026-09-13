#!/bin/sh

set -eu

certificate_directory=".certs"
ca_certificate="$certificate_directory/dev-ca.crt"
ca_private_key="$certificate_directory/dev-ca.key"
server_certificate="$certificate_directory/localhost.crt"
server_private_key="$certificate_directory/localhost.key"

find_lan_address() {
  if [ -n "${DEV_HTTPS_IP:-}" ]; then
    printf '%s\n' "$DEV_HTTPS_IP"
    return
  fi

  if command -v ifconfig >/dev/null 2>&1; then
    ifconfig | awk '/inet / && $2 !~ /^127\./ && $2 !~ /^169\.254\./ && $2 ~ /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/ { print $2; exit }'
    return
  fi

  hostname -I 2>/dev/null | awk '{ for (i = 1; i <= NF; i++) if ($i !~ /^127\./ && $i !~ /^169\.254\./) { print $i; exit } }'
}

lan_address="$(find_lan_address)"
if [ -z "$lan_address" ]; then
  echo "Could not find a private LAN IPv4 address. Set DEV_HTTPS_IP and try again." >&2
  exit 1
fi

mkdir -p "$certificate_directory"
chmod 700 "$certificate_directory"

if [ ! -s "$ca_certificate" ] || [ ! -s "$ca_private_key" ]; then
  openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 3650 \
    -subj "/CN=The VOID Local Development CA" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    -keyout "$ca_private_key" -out "$ca_certificate"
  chmod 600 "$ca_private_key"
fi

certificate_is_current=false
if [ -s "$server_certificate" ] && [ -s "$server_private_key" ]; then
  if openssl x509 -checkend 86400 -noout -in "$server_certificate" >/dev/null 2>&1 && \
    openssl x509 -in "$server_certificate" -noout -text 2>/dev/null | grep -F "IP Address:$lan_address" >/dev/null; then
    certificate_is_current=true
  fi
fi

if [ "$certificate_is_current" = false ]; then
  request_config="$(mktemp)"
  extension_config="$(mktemp)"
  request_file="$(mktemp)"
  trap 'rm -f "$request_config" "$extension_config" "$request_file"' EXIT

  {
    echo '[req]'
    echo 'distinguished_name = subject'
    echo 'prompt = no'
    echo '[subject]'
    echo 'CN = localhost'
  } > "$request_config"

  {
    echo 'basicConstraints = critical,CA:FALSE'
    echo 'keyUsage = critical,digitalSignature,keyEncipherment'
    echo 'extendedKeyUsage = serverAuth'
    echo "subjectAltName = DNS:localhost,IP:127.0.0.1,IP:::1,IP:$lan_address"
  } > "$extension_config"

  openssl req -new -newkey rsa:2048 -sha256 -nodes -config "$request_config" \
    -keyout "$server_private_key" -out "$request_file"
  openssl x509 -req -sha256 -days 825 -in "$request_file" \
    -CA "$ca_certificate" -CAkey "$ca_private_key" \
    -CAserial "$certificate_directory/dev-ca.srl" -CAcreateserial \
    -extfile "$extension_config" -out "$server_certificate"
  chmod 600 "$server_private_key"
fi

echo "Development certificate ready for https://$lan_address:5190/"
echo "Install $ca_certificate on the phone and explicitly enable trust for it."

#!/usr/bin/env bash
set -euo pipefail

echo "=== 1) Installing Docker (first run only) ==="
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "Docker already installed"
fi

echo "=== 2) Cloning the project ==="
if [ ! -d /opt/shopverse/.git ]; then
  git clone https://github.com/SalahFathy25/grounded.git /opt/shopverse
fi
cd /opt/shopverse

echo "=== 3) Generating secrets (.env) ==="
if [ ! -f .env ]; then
  umask 077
  {
    echo "JWT_SECRET=$(openssl rand -hex 64)"
    echo "ADMIN_INITIAL_PASSWORD=$(openssl rand -base64 12 | tr -d '/+=' | head -c 16)"
    # Optional - use PostgreSQL (e.g. Neon) instead of the built-in SQLite file:
    # echo "DB_URL=postgres://user:pass@host:5432/db"
  } > .env
  echo ".env created"
else
  echo ".env already exists (keeping it)"
fi

echo "=== 4) Starting the whole store ==="
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "===================================================="
echo " DONE!"
IP=$(hostname -I | awk '{print $1}')
echo " Store:  http://$IP"
echo " Admin:  http://$IP/admin/login"
source .env
echo " Admin login: admin@grounded.store"
echo " Admin password: $ADMIN_INITIAL_PASSWORD"
echo " (Save this password somewhere safe!)"
echo "===================================================="

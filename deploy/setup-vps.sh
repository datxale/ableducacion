#!/bin/bash
set -euo pipefail

echo "=== Setting up ABL Educacion on VPS ==="

APP_DIR="${APP_DIR:-/home/ubuntu/ableducacion}"
REPO_URL="${REPO_URL:-https://github.com/datxale/ableducacion.git}"
DOMAIN="${DOMAIN:-portal.inaci.edu.pe}"
PUBLIC_IP="${PUBLIC_IP:-141.227.151.20}"
DB_NAME="${DB_NAME:-ableducacion}"
DB_USER="${DB_USER:-ableducacion}"
DB_PASSWORD="${DB_PASSWORD:-ableducacion123}"

# Create PostgreSQL database and user
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

# Clone repository
if [ ! -d "${APP_DIR}/.git" ]; then
    git clone "${REPO_URL}" "${APP_DIR}"
else
    git -C "${APP_DIR}" pull --ff-only
fi
cd "${APP_DIR}"

# Setup Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://ableducacion:ableducacion123@localhost:5432/ableducacion
SECRET_KEY=abl-educacion-secret-key-prod-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://portal.inaci.edu.pe,https://portal.inaci.edu.pe,http://pontealdia.ableducacion.com,https://pontealdia.ableducacion.com
ENVEOF
sed -i "s|postgresql://ableducacion:ableducacion123@localhost:5432/ableducacion|postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}|g" .env
sed -i "s|http://portal.inaci.edu.pe,https://portal.inaci.edu.pe|http://${DOMAIN},https://${DOMAIN}|g" .env

# Seed initial data
python seed.py || echo "Seed already run or failed"
deactivate

# Setup Frontend
cd "${APP_DIR}/frontend"
npm ci --legacy-peer-deps || npm install --legacy-peer-deps
REACT_APP_API_BASE_URL="/api" npm run build

# Copy build to nginx directory
sudo rm -rf /var/www/ableducacion
sudo cp -r build /var/www/ableducacion

# Setup systemd service for backend
sudo cp "${APP_DIR}/deploy/ableducacion-backend.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ableducacion-backend
sudo systemctl restart ableducacion-backend
sleep 2
curl -fsS http://127.0.0.1:8000/health >/dev/null

# Setup Nginx
sudo cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/ableducacion
sudo ln -sf /etc/nginx/sites-available/ableducacion /etc/nginx/sites-enabled/ableducacion
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Open firewall ports
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

echo "=== Setup Complete ==="
echo "Frontend: http://${DOMAIN} (fallback: http://${PUBLIC_IP})"
echo "Backend API: http://${DOMAIN}/api/docs (fallback: http://${PUBLIC_IP}/api/docs)"

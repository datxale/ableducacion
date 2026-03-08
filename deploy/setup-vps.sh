#!/bin/bash
set -e

echo "=== Setting up ABL Educacion on VPS ==="

# Create PostgreSQL database and user
sudo -u postgres psql -c "CREATE USER ableducacion WITH PASSWORD 'ableducacion123';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE ableducacion OWNER ableducacion;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ableducacion TO ableducacion;"

# Clone repository
if [ ! -d "/home/ubuntu/ableducacion" ]; then
    git clone https://github.com/datxale/ableducacion.git /home/ubuntu/ableducacion
fi
cd /home/ubuntu/ableducacion

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
ENVEOF

# Seed initial data
python seed.py || echo "Seed already run or failed"
deactivate

# Setup Frontend
cd /home/ubuntu/ableducacion/frontend
npm install --legacy-peer-deps
npm run build

# Copy build to nginx directory
sudo rm -rf /var/www/ableducacion
sudo cp -r build /var/www/ableducacion

# Setup Nginx
sudo cp /home/ubuntu/ableducacion/deploy/nginx.conf /etc/nginx/sites-available/ableducacion
sudo ln -sf /etc/nginx/sites-available/ableducacion /etc/nginx/sites-enabled/ableducacion
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Setup systemd service for backend
sudo cp /home/ubuntu/ableducacion/deploy/ableducacion-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ableducacion-backend
sudo systemctl start ableducacion-backend

# Open firewall ports
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

echo "=== Setup Complete ==="
echo "Frontend: http://141.227.151.20"
echo "Backend API: http://141.227.151.20/api/docs"

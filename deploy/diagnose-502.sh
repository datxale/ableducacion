#!/bin/bash
set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-ableducacion-backend}"
DOMAIN="${DOMAIN:-portal.inaci.edu.pe}"

echo "=== Diagnose 502 for ${DOMAIN} ==="
echo

echo "[1/6] Backend service status"
sudo systemctl status "${SERVICE_NAME}" --no-pager || true
echo

echo "[2/6] Backend logs (last 120 lines)"
sudo journalctl -u "${SERVICE_NAME}" -n 120 --no-pager || true
echo

echo "[3/6] Nginx validation and error logs"
sudo nginx -t || true
sudo tail -n 120 /var/log/nginx/error.log || true
echo

echo "[4/6] Local health checks"
curl -i --max-time 10 http://127.0.0.1:8000/health || true
curl -i --max-time 10 "http://${DOMAIN}/health" || true
echo

echo "[5/6] API login endpoint reachability"
curl -i --max-time 10 -X POST "http://${DOMAIN}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inaci.edu.pe","password":"InaciAdmin2026"}' || true
echo

echo "[6/6] Listening sockets for :8000"
sudo ss -ltnp | grep ':8000' || true
echo

echo "=== Finished ==="
echo "If local health fails, backend is down/misconfigured."
echo "If local health is OK but ${DOMAIN}/health fails, check nginx vhost and DNS."

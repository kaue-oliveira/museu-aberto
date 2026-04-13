#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_DIR="${ROOT_DIR}/backend"
BACKEND_STATIC_DIR="${BACKEND_DIR}/src/main/resources/static"
BACKEND_DB_DIR="${BACKEND_DIR}/data"

echo "== Museu Aberto: rebuild do zero =="
echo "Root: ${ROOT_DIR}"

echo
echo "== Parando backend antigo (se existir) =="
pkill -f "museu-aberto-backend-.*\\.jar" 2>/dev/null || true
pkill -f "java -jar .*museu-aberto-backend-.*\\.jar" 2>/dev/null || true

echo
echo "== Limpando banco local (H2) =="
mkdir -p "${BACKEND_DB_DIR}"
rm -f "${BACKEND_DB_DIR}/museuaberto.mv.db" "${BACKEND_DB_DIR}/museuaberto.trace.db" 2>/dev/null || true

echo
echo "== Frontend: instalar deps e buildar =="
cd "${FRONTEND_DIR}"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

echo
echo "== Backend: atualizar static (SPA) =="
mkdir -p "${BACKEND_STATIC_DIR}"
rm -rf "${BACKEND_STATIC_DIR:?}/"*
cp -R "${FRONTEND_DIR}/dist/frontend/browser/." "${BACKEND_STATIC_DIR}/"

echo
echo "== Backend: clean + package =="
cd "${BACKEND_DIR}"
mvn -DskipTests clean package

JAR_PATH="$(ls -1 target/*.jar | head -n 1)"
echo
echo "== Rodando backend =="
echo "Jar: ${JAR_PATH}"
echo "URL: http://localhost:8091"
echo
java -jar "${JAR_PATH}"


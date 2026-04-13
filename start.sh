#!/bin/bash

# ============================================================
# Museu Aberto - Script de Inicialização (Versão Portátil)
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR_FILE="$SCRIPT_DIR/backend/target/museu-aberto-backend-1.0.0.jar"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         Museu Aberto — Galeria Digital    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java não encontrado. Instale Java 17+${NC}"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
echo -e "${GREEN}✓ Java $JAVA_VERSION detectado${NC}"

if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}❌ Arquivo JAR não encontrado em $JAR_FILE${NC}"
    exit 1
fi

# Start application
echo ""
echo -e "${BLUE}🚀 Iniciando aplicação na porta 8091...${NC}"
java -jar "$JAR_FILE" &
APP_PID=$!

# Wait for application to be ready
echo -e "${YELLOW}⏳ Aguardando inicialização...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8091/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Aplicação pronta!${NC}"
        break
    fi
    sleep 1
done

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           Aplicação Iniciada!             ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Acesse: http://localhost:8091            ║${NC}"
echo -e "${CYAN}║  API:    http://localhost:8091/api        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar a aplicação${NC}"
echo ""

# Trap to kill process on exit
trap "echo ''; echo -e '${YELLOW}Parando aplicação...${NC}'; kill $APP_PID 2>/dev/null; echo -e '${GREEN}Aplicação parada.${NC}'" EXIT

wait $APP_PID

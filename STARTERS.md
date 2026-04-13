# Instruções de inicialização

Este arquivo contém todas as instruções de execução, build e desenvolvimento do projeto.

## Execução Rápida (Modo Portátil)

Use este modo quando o arquivo JAR já estiver disponível em `backend/target`.

### Linux/macOS

```bash
chmod +x start.sh
./start.sh
```

### Windows

```bat
start.bat
```

Ao iniciar:

- App: http://localhost:8091
- API: http://localhost:8091/api
- Health check: http://localhost:8091/api/health
- H2 console: http://localhost:8091/h2-console

**Observação importante:**

- Os scripts `start.sh` e `start.bat` esperam exatamente o arquivo `backend/target/museu-aberto-backend-1.0.0.jar`.
- Se esse JAR não existir, execute o build (seções abaixo).

## Rebuild Completo do Zero (Linux/macOS)

O script `run-from-zero.sh` faz:

1. Encerra processos antigos do backend
2. Limpa o banco H2 local em `backend/data`
3. Instala dependências do frontend
4. Gera build Angular
5. Copia `dist/frontend/browser` para `backend/src/main/resources/static`
6. Executa `mvn clean package` no backend
7. Sobe o backend com `java -jar`

Uso:

```bash
chmod +x run-from-zero.sh
./run-from-zero.sh
```

## Desenvolvimento (Frontend + Backend Separados)

### 1) Subir backend

```bash
cd backend
mvn spring-boot:run
```

Backend em http://localhost:8091

### 2) Subir frontend

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

Frontend em http://localhost:4200

O arquivo `frontend/proxy.conf.json` redireciona requisições `/api` para http://localhost:8091.

## Build Manual de Produção

### Frontend

```bash
cd frontend
npm install
npm run build
```

Saída esperada: `frontend/dist/frontend/browser`

### Copiar frontend para o backend

```bash
mkdir -p backend/src/main/resources/static
rm -rf backend/src/main/resources/static/*
cp -R frontend/dist/frontend/browser/. backend/src/main/resources/static/
```

### Backend

```bash
cd backend
mvn -DskipTests clean package
java -jar target/museu-aberto-backend-1.0.0.jar
```

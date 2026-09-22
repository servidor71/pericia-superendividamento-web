# 🚀 Guia Oficial de Implantação na Hostinger (Perícia Superendividamento Web)

Este guia cobre a preparação e o passo a passo completo para hospedar a aplicação **Perícia Superendividamento Web** na **Hostinger** (Hospedagem de Sites Compartilhada com suporte a Node.js ou VPS).

---

## 🛠️ O que já foi preparado no código:

1. **Roteamento SPA Apache (`.htaccess`)**: Arquivo de reescrita criado em `public/.htaccess` e copiado automaticamente para `dist/.htaccess` ao gerar a build. Impede erros `404 Not Found` ao recarregar a página em rotas internas (`/login`, `/admin`, `/checkout`, etc.).
2. **Servidor Full-Stack Node.js (`server/index.js`)**: Configurado para rodar como API do Mercado Pago e servir os arquivos estáticos de `dist/` em ambiente de produção.
3. **Scripts de Inicialização (`package.json`)**:
   - `npm run build`: Compila o TypeScript e gera o pacote otimizado em `dist/`.
   - `npm start`: Inicia o servidor Node.js na porta configurada (`process.env.PORT || 3000`).
4. **Variáveis de Ambiente (`.env.example`)**: Modelo de variáveis configurado para produção.

---

## 📦 Opção 1: Hospedagem de Sites Compartilhada Hostinger (hPanel)

### Passo 1: Configurar a Aplicação Node.js no hPanel
1. Acesse o painel da **Hostinger (hPanel)**.
2. No menu lateral, procure por **Node.js** (Gerenciador de Aplicativos Node.js).
3. Clique em **Criar Aplicativo Node.js**:
   - **Versão do Node.js**: Escolha `18.x`, `20.x` ou superior.
   - **Modo do Aplicativo**: `Production`
   - **Diretório Raiz do App**: `/public_html` (ou o nome da sua pasta do aplicativo).
   - **Arquivo de Entrada (Startup File)**: `server/index.js`
4. Clique em **Criar / Salvar**.

### Passo 2: Enviar os Arquivos do Projeto
Você pode enviar os arquivos via **GitHub** (recomendado) ou pelo **Gerenciador de Arquivos**:

#### Método A via GitHub (Recomendado):
No hPanel, vá em **Avançado > Git**:
1. Repositório: `https://github.com/servidor71/pericia-superendividamento-web.git`
2. Branch: `main`
3. Clique em **Criar Repositório Git**.
4. Clique em **Implantar / Deploy**.

#### Método B via Gerenciador de Arquivos (Zip):
1. No seu computador, execute no terminal:
   ```bash
   npm run build
   ```
2. Compacte o conteúdo do seu projeto (incluindo `dist/`, `server/`, `package.json`, `.htaccess`, `.env`).
3. No hPanel da Hostinger, abra o **Gerenciador de Arquivos**, vá em `public_html` e faça o upload e extração do `.zip`.

### Passo 3: Configurar Variáveis de Ambiente e Instalar Dependências
1. No Gerenciador de Arquivos da Hostinger, crie o arquivo `.env` na raiz do site com o conteúdo:
   ```env
   PORT=3000
   NODE_ENV=production
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-access-token-oficial
   ```
2. No painel Node.js da Hostinger, clique em **Executar npm install** ou execute via terminal SSH:
   ```bash
   npm install --production
   ```
3. Reinicie a aplicação Node.js clicando no botão **Reiniciar App / Restart**.

---

## 💻 Opção 2: Servidor VPS Hostinger (Ubuntu / Nginx / PM2)

Se você utiliza um servidor VPS Linux na Hostinger:

### 1. Clonar o Repositório no VPS
```bash
cd /var/www
git clone https://github.com/servidor71/pericia-superendividamento-web.git
cd pericia-superendividamento-web
```

### 2. Instalar Dependências e Gerar a Build
```bash
npm install
npm run build
```

### 3. Configurar o Arquivo `.env`
```bash
cp .env.example .env
nano .env
# Adicione seu MERCADOPAGO_ACCESS_TOKEN e salve (Ctrl+O, Enter, Ctrl+X)
```

### 4. Gerenciar o Processo com PM2
```bash
npm install -g pm2
pm2 start server/index.js --name "pericia-web"
pm2 save
pm2 startup
```

### 5. Configurar o Nginx como Proxy Reverso
Edite a configuração do Nginx (`/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Teste e recarregue o Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Ativar Certificado SSL Gratuito (HTTPS)
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## ✅ Checklist Final de Verificação na Hostinger

- [x] Arquivo `.htaccess` presente na pasta `public_html` / `dist/`
- [x] Node.js na versão 18+ habilitado
- [x] Variável `MERCADOPAGO_ACCESS_TOKEN` configurada no `.env`
- [x] Porta `3000` escutando requisições
- [x] Rotas do React SPA testadas (ex: `/login`, `/admin`) sem erro 404

# syntax=docker/dockerfile:1.7

# Estágio de build (Compilação do React + Vite)
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos do package manager para cachear dependências
COPY package*.json ./
RUN npm ci

# Copia os demais arquivos do projeto
COPY . .

# Executa o build de produção (gera a pasta /app/dist)
RUN npm run build

# Estágio final de execução (Nginx Alpine)
FROM nginx:1.27-alpine

# Metadados da imagem baseados no exemplo
LABEL org.opencontainers.image.title="web-app-cliente" \
      org.opencontainers.image.description="Portal do Cliente da Contabilize Seguro" \
      maintainer="seu-email@exemplo.com"

# Instala wget para o healthcheck (curl também é uma opção, mas wget é menor)
# Remove cache do apk para reduzir o tamanho da imagem
RUN apk add --no-cache wget && \
    rm -rf /var/cache/apk/*

# Remove o HTML padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos compilados do estágio anterior (build)
COPY --from=build /app/dist /usr/share/nginx/html/

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do Nginx
EXPOSE 80

# Healthcheck usando wget
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

# Comando para rodar o Nginx no foreground
CMD ["nginx", "-g", "daemon off;"]

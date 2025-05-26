# Node 18 em Alpine para imagem enxuta
FROM node:18-alpine

# diretório de trabalho
WORKDIR /app

# copia todo o projeto
COPY . .

# instala dependências de produção e dev (precisamos do código todo no container)
RUN npm ci            # mais rápido e reprodutível que 'npm install'

# porta do serviço (pode ser sobrescrita em runtime)
ENV SHIPPING_PORT=3001

# comando de inicialização
CMD ["node", "services/shipping/index.js"]

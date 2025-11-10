FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --include=dev || npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
RUN ./node_modules/.bin/tsc
EXPOSE 7860
CMD ["node", "dist/index.js"]
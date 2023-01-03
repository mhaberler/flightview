FROM node:18.12.1

RUN mkdir "/app"
WORKDIR "/app"
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run build

CMD ["npm", "run", "start"]
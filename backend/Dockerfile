FROM node
WORKDIR /usr/src/backend
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]



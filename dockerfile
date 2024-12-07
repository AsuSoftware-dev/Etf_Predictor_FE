# Imaginea de bază pentru build
FROM node:18-alpine as build

# Setează directorul de lucru
WORKDIR /app

# Copiază fișierele în container
COPY package*.json ./
COPY . .

# Setează variabila de mediu pentru URL-ul backend-ului
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Instalează dependințele și creează build-ul
RUN npm install
RUN npm run build

# Imaginea finală pentru Nginx
FROM nginx:alpine

# Copiază build-ul în folderul Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configurare implicită Nginx pentru rutele client-side
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expune portul 80
EXPOSE 80

# Pornește Nginx
CMD ["nginx", "-g", "daemon off;"]

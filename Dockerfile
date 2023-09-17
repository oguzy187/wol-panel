# Verwende das Node.js Alpine-Basisimage
FROM node:20-alpine

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package.json und package-lock.json-Dateien in den Container
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den gesamten Projektinhalt in den Container
COPY . .

# Setze den Port, auf dem die Anwendung lauscht
ENV PORT 3000

# Exponiere den Port, auf dem die Anwendung lauscht
EXPOSE $PORT

# Starte die Node.js-Anwendung
CMD [ "node", "app.js" ]
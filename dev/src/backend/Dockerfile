# Utilise l'image Node officielle
FROM node

# Crée un dossier de travail
WORKDIR /app

# Copie les fichiers de configuration (package.json, etc.)
COPY package.json package-lock.json ./

# Installe les dépendances
RUN npm install

# Copie le reste du code
COPY . .

# Expose le port 3000
EXPOSE 3000

# Lance la commande 'npm start'
CMD ["npm", "run", "start:dev"]

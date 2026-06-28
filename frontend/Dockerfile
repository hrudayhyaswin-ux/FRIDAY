FROM node:18-alpine

WORKDIR /app

# Copy package dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Set production environment and build static Next.js assets
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000

# Start production server
CMD ["npm", "start"]

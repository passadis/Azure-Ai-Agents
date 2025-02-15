# Use the official Node.js 20 image as the base image
FROM node:20

# Set environment variables for logging
ENV DEBUG=app:*
ENV NODE_DEBUG=*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if available) files
COPY package*.json ./

# Install debug package along with other dependencies
RUN npm install debug

# Install dependencies in the container
RUN npm install

# Copy the rest of your application's code
COPY . .

# Set Node to production and configure logging
ENV NODE_ENV=production
ENV LOG_LEVEL=debug

# Your app binds to port 5000
EXPOSE 5000

# Configure Docker logging
ENV FORCE_COLOR=1
ENV NPM_CONFIG_COLOR=always

# Define the command to run the app
CMD ["node", "server.js"]
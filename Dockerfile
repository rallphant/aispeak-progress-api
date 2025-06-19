# Dockerfile for Aispeak Progress API

# ---- Base Stage ----
# Use an official Node.js runtime as a parent image.
# Choose a version compatible with your project (e.g., 18-alpine for a smaller image).
FROM node:18-alpine AS base

# Set the working directory in the container
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
# Copy package.json and package-lock.json (or yarn.lock)
FROM base AS dependencies
COPY package.json package-lock.json* ./

# Install app dependencies
RUN npm install --omit=dev

# ---- Build Stage ----
# Copy the rest of the application code
FROM base AS build
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# ---- Production Stage ----
# Use a lean base image for the final stage
FROM node:18-alpine AS production
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package.json .

# Expose the port the app runs on (from your .env or default)
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/index.js"]
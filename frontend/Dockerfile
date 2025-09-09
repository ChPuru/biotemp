# Use a two-stage build for a smaller, more secure final image
# Stage 1: Build the React app
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app with a lightweight web server
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
# Copy a custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
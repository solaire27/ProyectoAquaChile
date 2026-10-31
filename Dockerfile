# ==========================================
# ETAPA 1: Construir el Frontend (React)
# ==========================================
FROM node:20  AS frontend-build
WORKDIR /app/frontend

COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Construir el Backend (Spring Boot)
# ==========================================

FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend
COPY Backend/pom.xml ./
RUN mvn dependency:go-offline
COPY Backend/src ./src
# Copiamos React compilado a los recursos estáticos de Spring Boot
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests

# ==========================================
# ETAPA 3: Imagen Final de Ejecución
# ==========================================

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=backend-build /app/backend/target/aquachile-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
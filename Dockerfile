# ==========================================
# ETAPA 1: Construir el Frontend (React)
# ==========================================
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Construir el Backend (Spring Boot)
# ==========================================

FROM eclipse-temurin:21-jdk-jammy AS backend-build
WORKDIR /app/backend
COPY Backend/mvnw Backend/pom.xml ./
COPY Backend/.mvn .mvn

RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline
COPY Backend/src ./src

COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN ./mvnw clean package -DskipTests

# ==========================================
# ETAPA 3: Imagen Final de Ejecución
# ==========================================

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=backend-build /app/backend/target/aquachile-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
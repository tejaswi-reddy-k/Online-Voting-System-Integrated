# Stage 1: Build the Spring Boot application using Maven and Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and source files
COPY pom.xml .
COPY src ./src

# Build executable JAR skipping tests for speed
RUN mvn clean package -DskipTests

# Stage 2: Minimal Java 21 runtime container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy artifact from build stage
COPY --from=build /app/target/online_voting_system-0.0.1-SNAPSHOT.jar app.jar

# Expose default HTTP port
EXPOSE 8080

# Start Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]

package com.project.online_voting_system.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String springDatasourceUrl;

    @Value("${spring.datasource.username:postgres}")
    private String springUsername;

    @Value("${spring.datasource.password:Tejaswi@17}")
    private String springPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Render or cloud environments provide DATABASE_URL or SPRING_DATASOURCE_URL
        String rawUrl = System.getenv("DATABASE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = springDatasourceUrl;
        }

        String jdbcUrl = "jdbc:postgresql://localhost:5432/online_voting_system_db";
        String username = springUsername;
        String password = springPassword;

        if (rawUrl != null && !rawUrl.isBlank()) {
            rawUrl = rawUrl.trim();
            try {
                // Handle postgres:// or postgresql:// (Render standard URL format)
                if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
                    URI uri = new URI(rawUrl);
                    String host = uri.getHost();
                    int port = (uri.getPort() != -1) ? uri.getPort() : 5432;
                    String path = uri.getPath(); // e.g. /online_voting_system_db

                    if (uri.getUserInfo() != null) {
                        String[] userParts = uri.getUserInfo().split(":", 2);
                        username = userParts[0];
                        if (userParts.length > 1) {
                            password = userParts[1];
                        }
                    }

                    jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                    if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
                        jdbcUrl += "?" + uri.getQuery();
                    } else if (!"localhost".equalsIgnoreCase(host) && !"127.0.0.1".equals(host)) {
                        jdbcUrl += "?sslmode=prefer";
                    }
                } else if (rawUrl.startsWith("jdbc:postgresql://")) {
                    // Check if credentials were accidentally included in jdbc:postgresql://user:pass@host
                    String withoutPrefix = rawUrl.substring("jdbc:postgresql://".length());
                    if (withoutPrefix.contains("@")) {
                        int atIndex = withoutPrefix.indexOf("@");
                        String userPart = withoutPrefix.substring(0, atIndex);
                        String hostAndDb = withoutPrefix.substring(atIndex + 1);

                        if (userPart.contains(":")) {
                            String[] userParts = userPart.split(":", 2);
                            username = userParts[0];
                            password = userParts[1];
                        } else {
                            username = userPart;
                        }
                        jdbcUrl = "jdbc:postgresql://" + hostAndDb;
                    } else {
                        jdbcUrl = rawUrl;
                    }
                } else {
                    jdbcUrl = rawUrl.startsWith("jdbc:") ? rawUrl : "jdbc:postgresql://" + rawUrl;
                }
            } catch (Exception e) {
                log.warn("Could not parse database URL '{}': {}. Using raw URL.", rawUrl, e.getMessage());
                jdbcUrl = rawUrl.startsWith("jdbc:") ? rawUrl : "jdbc:postgresql://" + rawUrl;
            }
        }

        // Allow explicit SPRING_DATASOURCE_USERNAME / PASSWORD to take precedence
        String envUser = System.getenv("SPRING_DATASOURCE_USERNAME");
        if (envUser != null && !envUser.isBlank()) {
            username = envUser;
        }
        String envPass = System.getenv("SPRING_DATASOURCE_PASSWORD");
        if (envPass != null && !envPass.isBlank()) {
            password = envPass;
        }

        log.info("Configuring PostgreSQL DataSource with JDBC URL: {} and Username: {}", jdbcUrl, username);

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}

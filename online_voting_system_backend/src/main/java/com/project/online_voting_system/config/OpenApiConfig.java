package com.project.online_voting_system.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Online Voting System REST API",
                version = "1.0",
                description = "Election Commission API with JWT Bearer Token Security. Click 'Authorize' button to authenticate with your Bearer token.",
                contact = @Contact(name = "Election Commission IT Cell", email = "tejaswireddykamjula2000@gmail.com")
        ),
        security = @SecurityRequirement(name = "BearerAuth")
)
@SecurityScheme(
        name = "BearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Enter JWT Bearer token obtained from /api/auth/signin"
)
public class OpenApiConfig {
    public static final String SECURITY_SCHEME_NAME = "BearerAuth";
}

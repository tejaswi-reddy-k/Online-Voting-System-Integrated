package com.project.online_voting_system.config;

import com.project.online_voting_system.model.Role;
import com.project.online_voting_system.model.User;
import com.project.online_voting_system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDefaultAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("admin@eci.gov.in")) {
                User admin = new User(
                        "admin@eci.gov.in",
                        passwordEncoder.encode("Admin@123"),
                        "Chief Election Officer",
                        "IND-ADM00001",
                        "National Parliamentary HQ",
                        Role.ADMIN,
                        true
                );
                admin.setDob("1980-01-01");
                userRepository.save(admin);
                System.out.println("[BOOTSTRAP] Created default Admin: admin@eci.gov.in / Admin@123");
            }

            if (!userRepository.existsByEmail("teju@gmail.com")) {
                User admin = new User(
                        "teju@gmail.com",
                        passwordEncoder.encode("Tejaswi@17"),
                        "System Administrator",
                        "IND-ADM00002",
                        "General Parliamentary Constituency",
                        Role.ADMIN,
                        true
                );
                admin.setDob("2000-05-17");
                userRepository.save(admin);
                System.out.println("[BOOTSTRAP] Created default Admin: teju@gmail.com / Tejaswi@17");
            }
        };
    }
}

package com.project.online_voting_system.service;

import com.project.online_voting_system.dto.AuthResponse;
import com.project.online_voting_system.dto.SigninRequest;
import com.project.online_voting_system.dto.SignupRequest;
import com.project.online_voting_system.dto.SignupResponse;
import com.project.online_voting_system.model.Role;
import com.project.online_voting_system.model.User;
import com.project.online_voting_system.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    /**
     * Registration strictly handles elector creation:
     * - No constituency assignment
     * - No tokenization/authorization issued at registration
     */
    public SignupResponse signUp(SignupRequest request) {
        if ("admin@gmail.com".equalsIgnoreCase(request.getEmail().trim())) {
            throw new RuntimeException("Single-Admin Policy: The administrator account (admin@gmail.com) is unique and cannot be re-registered.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered with Election Commission.");
        }

        // Requirement: Voter must be at least 18 years of age
        if (request.getDob() == null || request.getDob().trim().isBlank()) {
            throw new RuntimeException("Eligibility Error: Date of birth is mandatory. Elector must be at least 18 years of age to register.");
        }
        try {
            java.time.LocalDate birthDate = java.time.LocalDate.parse(request.getDob().trim());
            int age = java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
            if (age < 18) {
                throw new RuntimeException("Electoral Eligibility Error: You must be at least 18 years of age to register and participate in voting. Current age: " + age + " years.");
            }
        } catch (java.time.format.DateTimeParseException e) {
            throw new RuntimeException("Invalid Date of Birth format. Please provide a valid date in YYYY-MM-DD format.");
        }

        // Auto-generate official EPIC Number for new elector
        String epic = "IND-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Role assignedRole = Role.VOTER;

        // Elector is created with null constituency (removed from registration)
        User user = new User(
                request.getEmail().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                epic,
                null,
                assignedRole,
                true
        );
        user.setDob(request.getDob());

        user = userRepository.save(user);

        // Dispatch Email Confirmation
        emailService.sendRegistrationConfirmation(user.getEmail(), user.getFullName(), user.getEpicNumber());

        // Return registration response without tokenization authorization
        return new SignupResponse(
                "Elector registered successfully. Please proceed to sign in.",
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getDob(),
                user.getEpicNumber(),
                user.getRole().name(),
                user.isVerified()
        );
    }

    /**
     * Administrator Registration:
     * Enforces Single-Admin Policy. Only admin@gmail.com is permitted.
     */
    public SignupResponse signUpAdmin(SignupRequest request) {
        throw new RuntimeException("Single-Admin Policy: Only one administrator is allowed in this system (admin@gmail.com). Additional administrator accounts cannot be created.");
    }

    /**
     * Sign-in handles authentication & issues Bearer token for authorization
     */
    public AuthResponse signIn(SigninRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Elector not found in database"));

        // Enforce single-admin policy: only admin@gmail.com can hold ROLE_ADMIN
        if (user.getRole() == Role.ADMIN && !"admin@gmail.com".equalsIgnoreCase(user.getEmail())) {
            user.setRole(Role.VOTER);
            user = userRepository.save(user);
        }

        // Generate Bearer JWT token for authentication & authorization
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getDob(),
                user.getEpicNumber(),
                user.getConstituency(),
                user.getRole().name(),
                user.isVerified()
        );
    }
}

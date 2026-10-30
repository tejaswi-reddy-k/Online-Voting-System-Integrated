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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered with Election Commission.");
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
     * - Registers official administrator account with Role.ADMIN
     * - No tokenization/authorization issued at registration (authenticate via signin)
     */
    public SignupResponse signUpAdmin(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new RuntimeException("Email is already registered with Election Commission.");
        }

        // Auto-generate official Admin Identifier (EPIC)
        String adminEpic = "IND-ADM" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Role assignedRole = Role.ADMIN;

        User admin = new User(
                request.getEmail().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                adminEpic,
                "National Parliamentary HQ",
                assignedRole,
                true
        );
        admin.setDob(request.getDob());

        admin = userRepository.save(admin);

        // Dispatch Email Confirmation
        emailService.sendRegistrationConfirmation(admin.getEmail(), admin.getFullName(), admin.getEpicNumber());

        return new SignupResponse(
                "Administrator registered successfully. Please proceed to sign in.",
                admin.getId(),
                admin.getFullName(),
                admin.getEmail(),
                admin.getDob(),
                admin.getEpicNumber(),
                admin.getRole().name(),
                admin.isVerified()
        );
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

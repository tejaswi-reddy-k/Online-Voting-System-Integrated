package com.project.online_voting_system.controller;

import com.project.online_voting_system.dto.AuthResponse;
import com.project.online_voting_system.dto.SigninRequest;
import com.project.online_voting_system.dto.SignupRequest;
import com.project.online_voting_system.dto.SignupResponse;
import com.project.online_voting_system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signUp(@Valid @RequestBody SignupRequest request) {
        SignupResponse response = userService.signUp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signout")
    public ResponseEntity<Map<String, String>> signOut() {
        return ResponseEntity.ok(Map.of("message", "User signed out successfully. Token cleared."));
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signIn(@Valid @RequestBody SigninRequest request) {
        AuthResponse response = userService.signIn(request);
        return ResponseEntity.ok(response);
    }
}

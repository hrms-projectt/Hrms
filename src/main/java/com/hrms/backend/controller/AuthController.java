package com.hrms.backend.controller;

import com.hrms.backend.entity.User;
import com.hrms.backend.repository.UserRepository;
import com.hrms.backend.security.JwtUtil;
import com.hrms.backend.service.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklistService tokenBlacklistService;

    // Standard Constructor Injection (Solves the warning, no Lombok required)
    public AuthController(JwtUtil jwtUtil, UserRepository userRepository, 
                          PasswordEncoder passwordEncoder, TokenBlacklistService tokenBlacklistService) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent() && passwordEncoder.matches(password, userOptional.get().getPassword())) {
            User user = userOptional.get();
            String token = jwtUtil.generateToken(user.getEmail());

            response.put("token", token);
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole());
            userData.put("fullName", user.getFullName()); 
            response.put("user", userData);

            return ResponseEntity.ok(response);
        } else {
            response.put("status", 401);
            response.put("error", "Unauthorized");
            response.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody Map<String, String> userData) {
        Map<String, String> response = new HashMap<>();

        if (userRepository.findByEmail(userData.get("email")).isPresent()) {
            response.put("message", "Email already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        User newUser = new User();
        newUser.setEmail(userData.get("email"));
        newUser.setPassword(passwordEncoder.encode(userData.get("password")));
        newUser.setRole(userData.getOrDefault("role", "EMPLOYEE"));
        newUser.setFullName(userData.get("fullName")); 

        userRepository.save(newUser);

        response.put("message", "User registered successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        Map<String, String> response = new HashMap<>();
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            tokenBlacklistService.blacklistToken(token);
            
            response.put("message", "Logged out successfully.");
            return ResponseEntity.ok(response);
        }

        response.put("message", "No Authorization header found");
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset link sent to " + request.get("email"));
        return ResponseEntity.ok(response);
    }
}
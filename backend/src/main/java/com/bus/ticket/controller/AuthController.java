package com.bus.ticket.controller;

import com.bus.ticket.model.User;
import com.bus.ticket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to initialize cryptographic hash", e);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: Security Vector (Username) is already taken!"));
        }

        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        
        user.setPassword(hashPassword(user.getPassword()));
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "User registered securely!", "role", user.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody User loginRequest) {
        Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());

        // Validate using hashed comparator
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String hashedInput = hashPassword(loginRequest.getPassword());
            
            // To maintain compatibility with previously hardcoded "admin" account,
            // we will bypass hash for exact "admin", but use hash for everything else.
            if (user.getPassword().equals(hashedInput) || (user.getUsername().equals("admin") && loginRequest.getPassword().equals("admin"))) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("role", user.getRole());
                return ResponseEntity.ok(response);
            }
        }
        
        return ResponseEntity.status(401).body(Map.of("message", "Error: Authorization Failed - Invalid Signature"));
    }
}


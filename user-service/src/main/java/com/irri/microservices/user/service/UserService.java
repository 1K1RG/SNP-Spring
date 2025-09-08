package com.irri.microservices.user.service;

import com.irri.microservices.user.dto.UserRequest;
import com.irri.microservices.user.dto.UserResponse;
import com.irri.microservices.user.model.User;
import com.irri.microservices.user.repository.UserRepository;
import com.irri.microservices.user.security.JwtUtil;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    public UserService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }



    public UserResponse registerUser(UserRequest userRequest) {

        if (userRepository.existsByUsername(userRequest.username())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }
        if (userRepository.existsByEmail(userRequest.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        String encodedPassword = passwordEncoder.encode(userRequest.password());


        User user = new User(
                userRequest.username(),
                userRequest.firstName(),
                userRequest.lastName(),
                userRequest.middleName(),
                encodedPassword,
                userRequest.email(),
                "USER"
        );
        userRepository.save(user);
        log.info("User registered successfully");
        return new UserResponse(user.getId(), user.getUsername(), user.getFirstName(), user.getLastName(), user.getMiddleName(), user.getPassword(), user.getEmail(), user.getRole());
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid credentials");
        }

        // Generate JWT token for authenticated user
        return jwtUtil.generateToken(user.getUsername(), user.getRole());
    }

    public UserResponse getUserByUsername(String username) {
        log.info("Fetching user with username: {}", username); // Log the username

        return userRepository.findByUsername(username)
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getFirstName(), user.getLastName(), user.getMiddleName(), user.getPassword(), user.getEmail(), user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponse(user.getId(),user.getUsername(), user.getFirstName(), user.getLastName(), user.getMiddleName(), user.getPassword(), user.getEmail(), user.getRole()))
                .collect(Collectors.toList());
    }
}

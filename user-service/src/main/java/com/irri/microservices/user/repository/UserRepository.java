package com.irri.microservices.user.repository;

import com.irri.microservices.user.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    // Find user by username
    Optional<User> findByUsername(String username);
    // Check if user exists by username
    boolean existsByUsername(String username);
    // Check if user exists by email
    boolean existsByEmail(String email);
}

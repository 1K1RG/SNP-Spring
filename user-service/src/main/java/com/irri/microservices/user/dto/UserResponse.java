package com.irri.microservices.user.dto;

public record UserResponse(String id, String username, String firstName, String lastName, String middleName, String password, String email, String role) {
}

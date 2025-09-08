package com.irri.microservices.user.dto;

public record UserRequest(String id, String username, String firstName, String lastName, String middleName, String password, String email) {
}

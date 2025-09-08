package com.irri.microservices.user.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(value = "users")
public class User {
    @Id
    private String id;
    private String username;
    private String firstName;
    private String lastName;
    private String middleName;
    private String password;
    private String email;
    private String role;


    // Constructor
    public User() {}

    public User(String username, String firstName, String lastName, String middleName, String password, String email, String role) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.middleName = middleName;
        this.password = password;
        this.email = email;
        this.role = role;
    }

    // Getters and Setters
    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getMiddleName() {
        return middleName;
    }

    public void setMiddleName(String middleName) {
        this.middleName = middleName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}


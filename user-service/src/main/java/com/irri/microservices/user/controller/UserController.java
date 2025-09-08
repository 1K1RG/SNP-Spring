package com.irri.microservices.user.controller;

import com.irri.microservices.user.dto.LoginRequest;
import com.irri.microservices.user.dto.UserRequest;
import com.irri.microservices.user.dto.UserResponse;
import com.irri.microservices.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerUser(@RequestBody UserRequest userRequest){
        return userService.registerUser(userRequest);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(userService.login(loginRequest.username(), loginRequest.password()));
    }

    @PostMapping("/general/getUser")
    @ResponseStatus(HttpStatus.OK)
    public UserResponse getUser(@RequestBody UserRequest userRequest){
        return userService.getUserByUsername(userRequest.username());
    }


    @GetMapping("/admin/getAllUsers")
    @ResponseStatus(HttpStatus.OK)
    public List<UserResponse> getAllUsers(){
        return userService.getAllUsers();
    }
}

package com.api.vms.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.UserRequest;
import com.api.vms.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping
    public ApiResponse createUser(@RequestBody UserRequest request) {
        return service.createUser(request);
    }

    @GetMapping
    public ApiResponse getAll() {
        return service.getAllUsers();
    }
}
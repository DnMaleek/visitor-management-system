package com.api.vms.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.UserRequest;
import com.api.vms.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse createUser(@RequestBody UserRequest request) {
        return service.createUser(request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse getAll() {
        return service.getAllUsers();
    }

    @GetMapping("/hosts")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_GUARD')")
    public ApiResponse getHosts() {
        return service.getHosts();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse deleteUser(@PathVariable Long id) {
        return service.deleteUser(id);
    }
}
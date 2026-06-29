package com.api.vms.controller;

import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.UpdateProfileRequest;
import com.api.vms.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Profile endpoints — accessible to every authenticated user regardless of role.
 * The currently logged-in username is resolved from the JWT principal.
 */
@RestController
@RequestMapping("/api/users/profile")
public class ProfileController {

    private final UserService service;

    public ProfileController(UserService service) {
        this.service = service;
    }

    /** GET /api/users/profile — fetch own profile */
    @GetMapping
    public ApiResponse getProfile(Authentication auth) {
        return service.getProfile(auth.getName());
    }

    /** PUT /api/users/profile — update own fullName and/or password */
    @PutMapping
    public ApiResponse updateProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication auth) {
        return service.updateProfile(auth.getName(), request);
    }
}

package com.api.vms.controller;

import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.LoginRequest;
import com.api.vms.dto.LoginResponse;
import com.api.vms.entity.User;
import com.api.vms.exception.ResourceNotFoundException;
import com.api.vms.repository.UserRepository;
import com.api.vms.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepo,
            PasswordEncoder encoder,
            JwtService jwtService
    ) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ApiResponse login(
            @RequestBody LoginRequest request) {

        User user = userRepo.findByName(request.getName())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Invalid credentials"));

        boolean matches =
                encoder.matches(
                        request.getPassword(),
                        user.getPassword());

        if (!matches) {
            throw new ResourceNotFoundException("Invalid credentials");
        }

        String token =
                jwtService.generateToken(user.getName());

        return new ApiResponse(
                true,
                "Login successful",
                new LoginResponse(
                        token,
                        user.getName(),
                        user.getRole().name()
                )
        );
    }
}

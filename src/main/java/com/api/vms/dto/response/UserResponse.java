package com.api.vms.dto.response;

public record UserResponse(
        Long id,
        String name,
        String fullName,
        String email,
        String role,
        String department
) {
}
package com.api.vms.dto.response;

import java.time.LocalDateTime;

public record VisitorResponse(
        Long id,
        String fullName,
        String phoneNumber,
        String purpose,
        String status,
        String host,
        String department,
        LocalDateTime checkInTime,
        LocalDateTime checkOutTime
) {
}
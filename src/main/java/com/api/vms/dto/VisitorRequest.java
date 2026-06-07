package com.api.vms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VisitorRequest {

    @NotBlank
    public String fullName;

    @NotBlank
    public String phoneNumber;

    @NotBlank
    public String purpose;

    @NotNull
    public Long departmentId;

    @NotNull
    public Long hostId;
}
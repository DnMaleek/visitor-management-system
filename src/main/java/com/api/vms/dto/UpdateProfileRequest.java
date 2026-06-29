package com.api.vms.dto;

public class UpdateProfileRequest {

    /** New login username — optional, null/blank = keep existing */
    public String name;

    /** New full display name — optional, null/blank = keep existing */
    public String fullName;

    /** New email address — optional, null/blank = keep existing */
    public String email;

    /** Current password — required when changing password */
    public String currentPassword;

    /** New password — optional, null/blank = skip password change */
    public String newPassword;
}

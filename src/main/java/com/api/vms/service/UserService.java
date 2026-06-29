package com.api.vms.service;

import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.UpdateProfileRequest;
import com.api.vms.dto.UserRequest;
import com.api.vms.entity.Department;
import com.api.vms.entity.User;
import com.api.vms.entity.Visitor;
import com.api.vms.entity.enums.Role;
import com.api.vms.exception.ResourceNotFoundException;
import com.api.vms.repository.DepartmentRepository;
import com.api.vms.repository.UserRepository;
import com.api.vms.repository.VisitorRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final DepartmentRepository deptRepo;
    private final PasswordEncoder encoder;
    private final VisitorRepository visitorRepo;

    public UserService(UserRepository userRepo,
                       DepartmentRepository deptRepo,
                       PasswordEncoder encoder,
                       VisitorRepository visitorRepo) {
        this.userRepo = userRepo;
        this.deptRepo = deptRepo;
        this.encoder = encoder;
        this.visitorRepo = visitorRepo;
    }

    // CREATE USER
    public ApiResponse createUser(UserRequest req) {

        User user = new User();
        user.setName(req.name);
        user.setFullName(req.fullName);
        user.setEmail(req.email);
        String rawPassword = req.password;
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            rawPassword = "123456";
        }
        user.setPassword(encoder.encode(rawPassword));
        user.setRole(Role.valueOf(req.role));

        // assign department if exists
        if (req.departmentId != null) {
            Department dept = deptRepo.findById(req.departmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

            user.setDepartment(dept);
        }

        User saved = userRepo.save(user);

        return new ApiResponse(
                true,
                "User created successfully",
                saved
        );
    }

    // GET ALL USERS
    public ApiResponse getAllUsers() {
        List<User> users = userRepo.findAll();

        return new ApiResponse(
                true,
                "Users fetched successfully",
                users
        );
    }

    // GET HOSTS (for visitor registration dropdown)
    public ApiResponse getHosts() {
        List<User> hosts = userRepo.findByRole(Role.HOST);

        return new ApiResponse(
                true,
                "Hosts fetched successfully",
                hosts
        );
    }

    @Transactional
    public ApiResponse deleteUser(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Nullify host associations in visitors
        List<Visitor> hostVisits = visitorRepo.findByHost(user);
        for (Visitor v : hostVisits) {
            v.setHost(null);
        }
        visitorRepo.saveAll(hostVisits);

        // Nullify recordedBy associations in visitors
        List<Visitor> recordedVisits = visitorRepo.findByRecordedBy(user);
        for (Visitor v : recordedVisits) {
            v.setRecordedBy(null);
        }
        visitorRepo.saveAll(recordedVisits);

        // Delete the user
        userRepo.delete(user);

        return new ApiResponse(
                true,
                "User deleted successfully",
                null
        );
    }

    // UPDATE PROFILE (self-service — any authenticated user)
    @Transactional
    public ApiResponse updateProfile(String username, UpdateProfileRequest req) {
        User user = userRepo.findByName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean usernameChanged = false;

        // Update login username (name) if provided and different
        if (req.name != null && !req.name.trim().isEmpty()) {
            String newName = req.name.trim();
            if (!newName.equals(user.getName())) {
                if (userRepo.existsByName(newName)) {
                    return new ApiResponse(false, "Username '" + newName + "' is already taken", null);
                }
                user.setName(newName);
                usernameChanged = true;
            }
        }

        // Update full name if provided
        if (req.fullName != null && !req.fullName.trim().isEmpty()) {
            user.setFullName(req.fullName.trim());
        }

        // Update email if provided and different
        if (req.email != null && !req.email.trim().isEmpty()) {
            String newEmail = req.email.trim();
            if (!newEmail.equals(user.getEmail())) {
                if (userRepo.existsByEmail(newEmail)) {
                    return new ApiResponse(false, "Email '" + newEmail + "' is already in use", null);
                }
                user.setEmail(newEmail);
            }
        }

        // Change password only when both fields are supplied
        if (req.newPassword != null && !req.newPassword.trim().isEmpty()) {
            if (req.currentPassword == null ||
                    !encoder.matches(req.currentPassword, user.getPassword())) {
                return new ApiResponse(false, "Current password is incorrect", null);
            }
            if (req.newPassword.length() < 6) {
                return new ApiResponse(false, "New password must be at least 6 characters", null);
            }
            user.setPassword(encoder.encode(req.newPassword));
        }

        User saved = userRepo.save(user);
        String msg = usernameChanged
                ? "Profile updated — please log in again with your new username"
                : "Profile updated successfully";
        return new ApiResponse(true, msg, saved);
    }

    // GET PROFILE (self-service)
    public ApiResponse getProfile(String username) {
        User user = userRepo.findByName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new ApiResponse(true, "Profile fetched successfully", user);
    }
}
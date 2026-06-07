package com.api.vms.service;

import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.UserRequest;
import com.api.vms.entity.Department;
import com.api.vms.entity.User;
import com.api.vms.entity.enums.Role;
import com.api.vms.exception.ResourceNotFoundException;
import com.api.vms.repository.DepartmentRepository;
import com.api.vms.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final DepartmentRepository deptRepo;
    private final PasswordEncoder encoder;

    public UserService(UserRepository userRepo,
                       DepartmentRepository deptRepo,
                       PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.deptRepo = deptRepo;
        this.encoder = encoder;
    }

    // CREATE USER
    public ApiResponse createUser(UserRequest req) {

        User user = new User();
        user.setName(req.name);
        user.setFullName(req.fullName);
        user.setEmail(req.email);
        user.setPassword(encoder.encode(req.password));
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
}
package com.api.vms.service;

import com.api.vms.dto.ApiResponse;
import com.api.vms.entity.Department;
import com.api.vms.repository.DepartmentRepository;
import com.api.vms.repository.UserRepository;
import com.api.vms.repository.VisitorRepository;
import com.api.vms.entity.User;
import com.api.vms.entity.Visitor;
import com.api.vms.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository repo;
    private final UserRepository userRepo;
    private final VisitorRepository visitorRepo;

    public DepartmentService(DepartmentRepository repo,
                             UserRepository userRepo,
                             VisitorRepository visitorRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.visitorRepo = visitorRepo;
    }

    // CREATE
    public ApiResponse create(Department department) {
        Department saved = repo.save(department);

        return new ApiResponse(
                true,
                "Department created successfully",
                saved
        );
    }

    // GET ALL
    public ApiResponse getAll() {
        List<Department> list = repo.findAll();

        return new ApiResponse(
                true,
                "Departments fetched successfully",
                list
        );
    }

    // DELETE
    @Transactional
    public ApiResponse delete(Long id) {
        Department dept = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        // Nullify in Users
        List<User> users = userRepo.findByDepartment(dept);
        for (User u : users) {
            u.setDepartment(null);
        }
        userRepo.saveAll(users);

        // Nullify in Visitors
        List<Visitor> visitors = visitorRepo.findByDepartment(dept);
        for (Visitor v : visitors) {
            v.setDepartment(null);
        }
        visitorRepo.saveAll(visitors);

        repo.delete(dept);

        return new ApiResponse(
                true,
                "Department deleted successfully",
                null
        );
    }

    // UPDATE
    @Transactional
    public ApiResponse update(Long id, Department updated) {
        Department dept = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        dept.setName(updated.getName());
        dept.setDescription(updated.getDescription());

        Department saved = repo.save(dept);

        return new ApiResponse(
                true,
                "Department updated successfully",
                saved
        );
    }
}
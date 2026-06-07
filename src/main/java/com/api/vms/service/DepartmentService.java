package com.api.vms.service;

import com.api.vms.dto.ApiResponse;
import com.api.vms.entity.Department;
import com.api.vms.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository repo;

    public DepartmentService(DepartmentRepository repo) {
        this.repo = repo;
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
    public ApiResponse delete(Long id) {
        repo.deleteById(id);

        return new ApiResponse(
                true,
                "Department deleted successfully",
                null
        );
    }
}
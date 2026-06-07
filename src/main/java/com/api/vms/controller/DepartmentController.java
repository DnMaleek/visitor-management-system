package com.api.vms.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import com.api.vms.dto.ApiResponse;
import com.api.vms.entity.Department;
import com.api.vms.service.DepartmentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/departments")
@PreAuthorize("hasRole('ADMIN')")
public class DepartmentController {

    private final DepartmentService service;

    public DepartmentController(DepartmentService service) {
        this.service = service;
    }

    // CREATE department
    @PostMapping
    public ApiResponse create(@RequestBody Department department) {
        return service.create(department);
    }

    // GET ALL
    @GetMapping
    public ApiResponse getAll() {
        return service.getAll();
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable Long id) {
        return service.delete(id);
    }
}
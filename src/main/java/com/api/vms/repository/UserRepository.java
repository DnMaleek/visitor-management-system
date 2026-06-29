package com.api.vms.repository;

import com.api.vms.entity.User;
import com.api.vms.entity.Department;
import com.api.vms.entity.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByName(String name);

    List<User> findByRole(Role role);

    List<User> findByDepartment(Department department);

    boolean existsByName(String name);

    boolean existsByEmail(String email);
}
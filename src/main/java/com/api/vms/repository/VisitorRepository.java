package com.api.vms.repository;

import com.api.vms.entity.Visitor;
import com.api.vms.entity.enums.VisitorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    List<Visitor> findByStatus(VisitorStatus status);

    List<Visitor> findByHostId(Long hostId);
    long countByStatus(VisitorStatus status);

    List<Visitor> findByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    Page<Visitor> findAll(Pageable pageable);

}

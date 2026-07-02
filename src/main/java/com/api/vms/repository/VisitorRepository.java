package com.api.vms.repository;

import com.api.vms.entity.Visitor;
import com.api.vms.entity.User;
import com.api.vms.entity.enums.VisitorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
 
import java.time.LocalDateTime;
import java.util.List;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    List<Visitor> findByStatus(VisitorStatus status);

    List<Visitor> findByHostIdAndStatus(Long hostId, VisitorStatus status);

    List<Visitor> findByHostId(Long hostId);
    long countByStatus(VisitorStatus status);
    
    long countByIsCheckedInTrueAndIsCheckedOutFalse();
    long countByIsCheckedOutTrue();

    List<Visitor> findByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    List<Visitor> findByCheckInTimeIsNull();

    List<Visitor> findByIsCheckedInTrueAndIsCheckedOutFalse();

    // Guard-scoped queries (filtered by the guard who recorded the visitor)
    List<Visitor> findByRecordedByAndCheckInTimeIsNull(User recordedBy);

    List<Visitor> findByRecordedByAndIsCheckedInTrueAndIsCheckedOutFalse(User recordedBy);

    List<Visitor> findByRecordedByAndCreatedAtBetween(User recordedBy, LocalDateTime start, LocalDateTime end);

    List<Visitor> findByHost(User host);
    List<Visitor> findByRecordedBy(User recordedBy);
    
    List<Visitor> findByDepartment(com.api.vms.entity.Department department);

    Page<Visitor> findAll(Pageable pageable);

}

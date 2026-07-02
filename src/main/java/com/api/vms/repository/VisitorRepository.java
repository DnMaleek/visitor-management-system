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

    List<Visitor> findByStatusOrderByIdDesc(VisitorStatus status);

    List<Visitor> findByHostIdAndStatusOrderByIdDesc(Long hostId, VisitorStatus status);

    List<Visitor> findByHostIdOrderByIdDesc(Long hostId);
    long countByStatus(VisitorStatus status);
    
    long countByIsCheckedInTrueAndIsCheckedOutFalse();
    long countByIsCheckedOutTrue();

    List<Visitor> findByCreatedAtBetweenOrderByIdDesc(
            LocalDateTime start,
            LocalDateTime end
    );

    List<Visitor> findByCheckInTimeIsNullOrderByIdDesc();

    List<Visitor> findByIsCheckedInTrueAndIsCheckedOutFalseOrderByIdDesc();

    // Guard-scoped queries (filtered by the guard who recorded the visitor)
    List<Visitor> findByRecordedByAndCheckInTimeIsNullOrderByIdDesc(User recordedBy);

    List<Visitor> findByRecordedByAndIsCheckedInTrueAndIsCheckedOutFalseOrderByIdDesc(User recordedBy);

    List<Visitor> findByRecordedByAndCreatedAtBetweenOrderByIdDesc(User recordedBy, LocalDateTime start, LocalDateTime end);

    List<Visitor> findByHostOrderByIdDesc(User host);
    List<Visitor> findByRecordedByOrderByIdDesc(User recordedBy);
    
    List<Visitor> findByDepartmentOrderByIdDesc(com.api.vms.entity.Department department);

    Page<Visitor> findAll(Pageable pageable);

}

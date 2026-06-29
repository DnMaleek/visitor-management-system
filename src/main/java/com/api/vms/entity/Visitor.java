package com.api.vms.entity;

import com.api.vms.entity.enums.VisitorStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "visitors")
@Getter
@Setter
public class Visitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    private String phoneNumber;

    private String purpose;

    @Enumerated(EnumType.STRING)
    private VisitorStatus status = VisitorStatus.PENDING;

    private LocalDateTime checkInTime;

    private LocalDateTime checkOutTime;

    private boolean isCheckedIn = false;

    private boolean isCheckedOut = false;

    // Visitor belongs to a department
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    // Visitor assigned to a host (employee)
    @ManyToOne
    @JoinColumn(name = "host_id")
    private User host;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "recorded_by")
    private User recordedBy;
}
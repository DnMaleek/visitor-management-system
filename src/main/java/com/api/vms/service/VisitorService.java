package com.api.vms.service;

import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.VisitorRequest;
import com.api.vms.entity.Department;
import com.api.vms.entity.User;
import com.api.vms.entity.Visitor;
import com.api.vms.entity.enums.VisitorStatus;
import com.api.vms.exception.ResourceNotFoundException;
import com.api.vms.repository.DepartmentRepository;
import com.api.vms.repository.UserRepository;
import com.api.vms.repository.VisitorRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class VisitorService {

    private final VisitorRepository visitorRepo;
    private final DepartmentRepository departmentRepo;
    private final UserRepository userRepo;

    public VisitorService(
            VisitorRepository visitorRepo,
            DepartmentRepository departmentRepo,
            UserRepository userRepo
    ) {
        this.visitorRepo = visitorRepo;
        this.departmentRepo = departmentRepo;
        this.userRepo = userRepo;
    }

    public ApiResponse registerVisitor(VisitorRequest req) {

        Department department = departmentRepo.findById(req.departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        User host = userRepo.findById(req.hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Host not found"));

        Visitor visitor = new Visitor();
        visitor.setFullName(req.fullName);
        visitor.setPhoneNumber(req.phoneNumber);
        visitor.setPurpose(req.purpose);
        visitor.setDepartment(department);
        visitor.setHost(host);
        visitor.setStatus(VisitorStatus.PENDING);

        Visitor saved = visitorRepo.save(visitor);

        return new ApiResponse(
                true,
                "Visitor registered successfully",
                saved
        );
    }

    public ApiResponse approveVisitor(Long visitorId) {

        Visitor visitor = visitorRepo.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor not found"));

        visitor.setStatus(VisitorStatus.APPROVED);

        visitorRepo.save(visitor);

        return new ApiResponse(
                true,
                "Visitor approved successfully",
                visitor
        );
    }

    public ApiResponse rejectVisitor(Long visitorId) {

        Visitor visitor = visitorRepo.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor not found"));

        visitor.setStatus(VisitorStatus.REJECTED);

        visitorRepo.save(visitor);

        return new ApiResponse(
                true,
                "Visitor rejected successfully",
                visitor
        );
    }

    public ApiResponse checkIn(Long visitorId) {

        Visitor visitor = visitorRepo.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor not found"));

        if (visitor.getStatus() != VisitorStatus.APPROVED) {
            throw new ResourceNotFoundException("Visitor is not approved");
        }

        visitor.setStatus(VisitorStatus.CHECKED_IN);
        visitor.setCheckInTime(LocalDateTime.now());

        visitorRepo.save(visitor);

        return new ApiResponse(
                true,
                "Visitor checked in successfully",
                visitor
        );
    }

    public ApiResponse checkOut(Long visitorId) {

        Visitor visitor = visitorRepo.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor not found"));

        if (visitor.getStatus() != VisitorStatus.CHECKED_IN) {
            throw new ResourceNotFoundException("Visitor has not checked in");
        }

        visitor.setStatus(VisitorStatus.CHECKED_OUT);
        visitor.setCheckOutTime(LocalDateTime.now());

        visitorRepo.save(visitor);

        return new ApiResponse(
                true,
                "Visitor checked out successfully",
                visitor
        );
    }

    public ApiResponse getAllVisitors() {

        return new ApiResponse(
                true,
                "Visitors fetched successfully",
                visitorRepo.findAll()
        );
    }

    public ApiResponse getPendingVisitors() {

        return new ApiResponse(
                true,
                "Pending visitors",
                visitorRepo.findByStatus(
                        VisitorStatus.PENDING
                )
        );
    }

    public ApiResponse getVisitorsByHost(
            Long hostId
    ) {

        return new ApiResponse(
                true,
                "Visitors fetched",
                visitorRepo.findByHostId(hostId)
        );
    }

    public ApiResponse getVisitorsByStatus(String status) {

        return new ApiResponse(
                true,
                "Visitors fetched successfully",
                visitorRepo.findByStatus(
                        VisitorStatus.valueOf(
                                status.toUpperCase()
                        )
                )
        );
    }

    public ApiResponse getTodaysVisitors() {

        LocalDateTime start =
                LocalDate.now().atStartOfDay();

        LocalDateTime end =
                LocalDate.now().atTime(23,59,59);

        return new ApiResponse(
                true,
                "Today's visitors",
                visitorRepo.findByCreatedAtBetween(
                        start,
                        end
                )
        );
    }

    public ApiResponse getVisitors(
            int page,
            int size
    ) {

        return new ApiResponse(
                true,
                "Visitors fetched",
                visitorRepo.findAll(
                        PageRequest.of(page, size)
                )
        );
    }
}

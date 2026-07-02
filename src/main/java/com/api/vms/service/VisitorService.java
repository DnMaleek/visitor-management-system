package com.api.vms.service;

import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.VisitorRequest;
import com.api.vms.entity.User;
import com.api.vms.entity.Visitor;
import com.api.vms.entity.enums.VisitorStatus;
import com.api.vms.exception.ResourceNotFoundException;
import com.api.vms.repository.UserRepository;
import com.api.vms.repository.VisitorRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class VisitorService {

    private final VisitorRepository visitorRepo;
    private final UserRepository userRepo;

    public VisitorService(
            VisitorRepository visitorRepo,
            UserRepository userRepo
    ) {
        this.visitorRepo = visitorRepo;
        this.userRepo = userRepo;
    }

    public ApiResponse registerVisitor(VisitorRequest req, String recorderUsername) {

        User host = userRepo.findById(req.hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Host not found"));

        User recorder = userRepo.findByName(recorderUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Recorder not found"));

        Visitor visitor = new Visitor();
        visitor.setFullName(req.fullName);
        visitor.setPhoneNumber(req.phoneNumber);
        visitor.setPurpose(req.purpose);
        visitor.setHost(host);
        visitor.setStatus(VisitorStatus.PENDING);

        // Auto-populate department from the selected host
        if (host.getDepartment() != null) {
            visitor.setDepartment(host.getDepartment());
        }

        // Record who registered this visitor
        visitor.setRecordedBy(recorder);

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

        if (visitor.getStatus() != VisitorStatus.APPROVED && visitor.getStatus() != VisitorStatus.PENDING) {
            throw new ResourceNotFoundException("Visitor is not approved or pending");
        }

        visitor.setCheckedIn(true);
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

        if (visitor.getStatus() == VisitorStatus.PENDING) {
            throw new ResourceNotFoundException("Cannot check out a visitor with PENDING status. The host must approve first.");
        }

        if (!visitor.isCheckedIn() || visitor.isCheckedOut()) {
            throw new ResourceNotFoundException("Visitor is not checked in or already checked out");
        }

        visitor.setCheckedOut(true);
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

    public ApiResponse getUncheckedInVisitors() {
        return new ApiResponse(
                true,
                "Unchecked-in visitors fetched",
                visitorRepo.findByCheckInTimeIsNull()
        );
    }

    public ApiResponse getCheckedInVisitors() {
        return new ApiResponse(
                true,
                "Checked-in visitors",
                visitorRepo.findByIsCheckedInTrueAndIsCheckedOutFalse()
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

    public ApiResponse getMyVisitors(String username) {
        User host = userRepo.findByName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Host not found"));
        return new ApiResponse(
                true,
                "My visitors fetched successfully",
                visitorRepo.findByHostId(host.getId())
        );
    }

    public ApiResponse getMyPendingVisitors(String username) {
        User host = userRepo.findByName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Host not found"));
        return new ApiResponse(
                true,
                "My pending visitors fetched successfully",
                visitorRepo.findByHostIdAndStatus(host.getId(), VisitorStatus.PENDING)
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

    public ApiResponse getAllVisitorsFlat() {
        return new ApiResponse(
                true,
                "All visitors fetched",
                visitorRepo.findAll()
        );
    }

    public ApiResponse deleteVisitor(Long id) {
        Visitor visitor = visitorRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor not found"));
        visitorRepo.delete(visitor);
        return new ApiResponse(true, "Visitor deleted successfully", null);
    }

    // ── Guard-scoped methods (only visitors the guard registered) ──

    public ApiResponse getMyUncheckedInVisitors(String username) {
        User guard = userRepo.findByName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Guard not found"));
        return new ApiResponse(
                true,
                "My unchecked-in visitors fetched",
                visitorRepo.findByRecordedByAndCheckInTimeIsNull(guard)
        );
    }

    public ApiResponse getMyCheckedInVisitors(String username) {
        User guard = userRepo.findByName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Guard not found"));
        return new ApiResponse(
                true,
                "My checked-in visitors fetched",
                visitorRepo.findByRecordedByAndIsCheckedInTrueAndIsCheckedOutFalse(guard)
        );
    }

    public ApiResponse getMyTodayVisitors(String username) {
        User guard = userRepo.findByName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Guard not found"));
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end   = LocalDate.now().atTime(23, 59, 59);
        return new ApiResponse(
                true,
                "My today's visitors fetched",
                visitorRepo.findByRecordedByAndCreatedAtBetween(guard, start, end)
        );
    }
}

package com.api.vms.controller;

import com.api.vms.dto.ApiResponse;
import com.api.vms.dto.VisitorRequest;
import com.api.vms.service.VisitorService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

    private final VisitorService service;

    public VisitorController(VisitorService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('SECURITY_GUARD')")
    public ApiResponse registerVisitor(
            @Valid @RequestBody VisitorRequest request,
            Authentication authentication
    ) {
        return service.registerVisitor(request, authentication.getName());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('HOST')")
    public ApiResponse approve(
            @PathVariable Long id) {
        return service.approveVisitor(id);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('HOST')")
    public ApiResponse reject(
            @PathVariable Long id) {
        return service.rejectVisitor(id);
    }

    @PutMapping("/{id}/check-in")
    @PreAuthorize("hasRole('SECURITY_GUARD')")
    public ApiResponse checkIn(
            @PathVariable Long id) {
        return service.checkIn(id);
    }

    @PutMapping("/{id}/check-out")
    @PreAuthorize("hasRole('SECURITY_GUARD')")
    public ApiResponse checkOut(
            @PathVariable Long id) {
        return service.checkOut(id);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ApiResponse getPending() {
        return service.getPendingVisitors();
    }

    @GetMapping("/my-pending")
    @PreAuthorize("hasRole('HOST')")
    public ApiResponse getMyPending(Authentication authentication) {
        return service.getMyPendingVisitors(authentication.getName());
    }

    @GetMapping("/host/{hostId}")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ApiResponse getHostVisitors(
            @PathVariable Long hostId
    ) {
        return service.getVisitorsByHost(hostId);
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('HOST','ADMIN')")
    public ApiResponse getMyVisitors(Authentication authentication) {
        return service.getMyVisitors(authentication.getName());
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN','HOST','SECURITY_GUARD')")
    public ApiResponse getByStatus(
            @PathVariable String status
    ) {
        return service.getVisitorsByStatus(status);
    }

    @GetMapping("/unchecked-in")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD')")
    public ApiResponse getUncheckedIn() {
        return service.getUncheckedInVisitors();
    }

    @GetMapping("/checked-in")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD')")
    public ApiResponse getCheckedIn() {
        return service.getCheckedInVisitors();
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN','HOST','SECURITY_GUARD')")
    public ApiResponse getTodayVisitors() {
        return service.getTodaysVisitors();
    }

    @GetMapping("/my-unchecked-in")
    @PreAuthorize("hasRole('SECURITY_GUARD')")
    public ApiResponse getMyUncheckedIn(Authentication authentication) {
        return service.getMyUncheckedInVisitors(authentication.getName());
    }

    @GetMapping("/my-checked-in")
    @PreAuthorize("hasRole('SECURITY_GUARD')")
    public ApiResponse getMyCheckedIn(Authentication authentication) {
        return service.getMyCheckedInVisitors(authentication.getName());
    }

    @GetMapping("/my-today")
    @PreAuthorize("hasRole('SECURITY_GUARD')")
    public ApiResponse getMyToday(Authentication authentication) {
        return service.getMyTodayVisitors(authentication.getName());
    }

    @GetMapping
    public ApiResponse getVisitors(

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        return service.getVisitors(
                page,
                size
        );
    }


    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse getAllVisitors() {
        return service.getAllVisitorsFlat();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse deleteVisitor(@PathVariable Long id) {
        return service.deleteVisitor(id);
    }
}
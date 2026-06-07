package com.api.vms.dto.response;

public record DashboardResponse(
        long totalVisitors,
        long pendingVisitors,
        long approvedVisitors,
        long checkedInVisitors,
        long checkedOutVisitors
) {
}
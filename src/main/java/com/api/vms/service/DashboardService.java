package com.api.vms.service;

import com.api.vms.dto.response.DashboardResponse;
import com.api.vms.entity.enums.VisitorStatus;
import com.api.vms.repository.VisitorRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final VisitorRepository visitorRepo;

    public DashboardService(VisitorRepository visitorRepo) {
        this.visitorRepo = visitorRepo;
    }

    public DashboardResponse getStats() {
        return new DashboardResponse(
                visitorRepo.count(),
                visitorRepo.countByStatus(VisitorStatus.PENDING),
                visitorRepo.countByStatus(VisitorStatus.APPROVED),
                visitorRepo.countByIsCheckedInTrueAndIsCheckedOutFalse(),
                visitorRepo.countByIsCheckedOutTrue()
        );
    }
}
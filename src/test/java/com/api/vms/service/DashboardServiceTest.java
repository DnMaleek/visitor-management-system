package com.api.vms.service;

import com.api.vms.dto.response.DashboardResponse;
import com.api.vms.entity.enums.VisitorStatus;
import com.api.vms.repository.VisitorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private VisitorRepository visitorRepo;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getStatsCountsCheckedInVisitorsFromStatusWhenFlagsAreNotSet() {
        when(visitorRepo.count()).thenReturn(10L);
        when(visitorRepo.countByStatus(VisitorStatus.PENDING)).thenReturn(2L);
        when(visitorRepo.countByStatus(VisitorStatus.APPROVED)).thenReturn(3L);
        when(visitorRepo.countByIsCheckedInTrueAndIsCheckedOutFalse()).thenReturn(4L);
        when(visitorRepo.countByIsCheckedOutTrue()).thenReturn(1L);

        DashboardResponse response = dashboardService.getStats();

        assertThat(response.totalVisitors()).isEqualTo(10L);
        assertThat(response.pendingVisitors()).isEqualTo(2L);
        assertThat(response.approvedVisitors()).isEqualTo(3L);
        assertThat(response.checkedInVisitors()).isEqualTo(4L);
        assertThat(response.checkedOutVisitors()).isEqualTo(1L);
    }
}

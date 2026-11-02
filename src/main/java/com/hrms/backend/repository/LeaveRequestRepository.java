package com.hrms.backend.repository;

import com.hrms.backend.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<LeaveRequest> findByEmployeeIdAndStatusAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
            Long employeeId, String status, LocalDate startDate, LocalDate endDate);
}
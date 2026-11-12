package com.hrms.backend.repository;

import com.hrms.backend.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, Long> {
    boolean existsByLeaveTypeIgnoreCase(String leaveType);
    Optional<LeavePolicy> findByLeaveTypeIgnoreCase(String leaveType);
}
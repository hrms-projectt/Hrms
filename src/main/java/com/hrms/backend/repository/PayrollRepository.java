package com.hrms.backend.repository;

import com.hrms.backend.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByPayrollMonth(String payrollMonth);
    Optional<Payroll> findByEmployeeIdAndPayrollMonth(Long employeeId, String payrollMonth);
}
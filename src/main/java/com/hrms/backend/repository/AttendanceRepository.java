package com.hrms.backend.repository;

import com.hrms.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    // For Task N-9: Daily attendance view
    List<Attendance> findByAttendanceDate(LocalDate attendanceDate);

    // For Task T-8: Check if employee already clocked in/out today
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    // For Task S-9 & T-11: Date range filter for HR Attendance History & Manager Calendar
    List<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);

    // For Task N-15: Fetch monthly attendance for a specific employee during payroll processing
    List<Attendance> findByEmployeeIdAndAttendanceDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);
}
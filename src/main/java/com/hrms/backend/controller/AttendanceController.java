package com.hrms.backend.controller;

import com.hrms.backend.dto.DailyAttendanceResponse;
import com.hrms.backend.entity.Attendance;
import com.hrms.backend.repository.AttendanceRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/attendance")
@CrossOrigin(originPatterns = "*")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    public AttendanceController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping("/daily/{date}")
    public ResponseEntity<List<DailyAttendanceResponse>> getDailyAttendance(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        List<Attendance> records = attendanceRepository.findByAttendanceDate(date);

        List<DailyAttendanceResponse> response = records.stream().map(att -> {
            String empName = att.getEmployee().getFirstName() + " " + att.getEmployee().getLastName();
            String deptName = att.getEmployee().getDepartment() != null ? att.getEmployee().getDepartment() : "General";

            return new DailyAttendanceResponse(
                    att.getId(),
                    att.getEmployee().getId(),
                    empName,
                    deptName,
                    att.getAttendanceDate(),
                    att.getCheckInTime(),
                    att.getCheckOutTime(),
                    att.getWorkingMinutes(),
                    att.getStatus(),
                    att.getIsLate(),
                    att.getIsEarlyExit()
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
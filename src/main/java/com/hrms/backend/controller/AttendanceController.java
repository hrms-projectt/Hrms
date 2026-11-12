package com.hrms.backend.controller;

import com.hrms.backend.dto.DailyAttendanceResponse;
import com.hrms.backend.entity.Attendance;
import com.hrms.backend.entity.Employee;
import com.hrms.backend.repository.AttendanceRepository;
import com.hrms.backend.repository.EmployeeRepository;
import com.hrms.backend.service.AttendanceCalculationService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/attendance")
@CrossOrigin(originPatterns = "*")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceCalculationService calculationService;
    private final StringRedisTemplate redisTemplate;

    public AttendanceController(AttendanceRepository attendanceRepository,
                                EmployeeRepository employeeRepository,
                                AttendanceCalculationService calculationService,
                                StringRedisTemplate redisTemplate) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.calculationService = calculationService;
        this.redisTemplate = redisTemplate;
    }

    // Helper method to convert Entity to DTO
    private DailyAttendanceResponse mapToResponse(Attendance att) {
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
    }

    // 1. Task T-8: Check today's clock-in status for the Employee Dashboard Widget
    @GetMapping("/today/{employeeId}")
    public ResponseEntity<?> getTodayStatus(@PathVariable Long employeeId) {
        LocalDate today = LocalDate.now();
        return attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today)
                .map(att -> ResponseEntity.ok(Map.of(
                        "checkedIn", att.getCheckInTime() != null,
                        "checkedOut", att.getCheckOutTime() != null,
                        "checkInTime", att.getCheckInTime() != null ? att.getCheckInTime().toString() : "",
                        "checkOutTime", att.getCheckOutTime() != null ? att.getCheckOutTime().toString() : "",
                        "status", att.getStatus()
                )))
                .orElseGet(() -> ResponseEntity.ok(Map.of(
                        "checkedIn", false,
                        "checkedOut", false,
                        "status", "NOT_CHECKED_IN"
                )));
    }

    // 2. Task T-8 & J-8/J-9: Employee Clock-In (Prevents double check-in + Caches in Redis for 24h)
    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, Long> payload) {
        Long employeeId = payload.get("employeeId");
        if (employeeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId is required"));
        }

        Employee emp = employeeRepository.findById(employeeId).orElse(null);
        if (emp == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Employee not found"));
        }

        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Already checked in today"));
        }

        LocalTime now = LocalTime.now().withNano(0);
        Attendance attendance = new Attendance();
        attendance.setEmployee(emp);
        attendance.setShift(emp.getShift());
        attendance.setAttendanceDate(today);
        attendance.setCheckInTime(now);

        calculationService.calculateAttendanceMetrics(attendance, emp.getShift());
        Attendance saved = attendanceRepository.save(attendance);

        // Cache check-in event in AWS ElastiCache Redis for 24 hours (86400 seconds)
        try {
            String redisKey = "attendance:checkin:EMP" + String.format("%03d", employeeId);
            redisTemplate.opsForValue().set(redisKey, now.toString(), 86400, TimeUnit.SECONDS);
        } catch (Exception ignored) {
            // Prevents API failure if local SSH tunnel to Redis is closed
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Clocked in successfully at " + now,
                "checkInTime", now.toString(),
                "status", saved.getStatus()
        ));
    }

    // 3. Task T-8 & N-9: Employee Clock-Out (Calculates working hours, break deduction & early exit)
    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@RequestBody Map<String, Long> payload) {
        Long employeeId = payload.get("employeeId");
        if (employeeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId is required"));
        }

        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today)
                .orElse(null);

        if (attendance == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Cannot clock out without clocking in first"));
        }
        if (attendance.getCheckOutTime() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Already clocked out today"));
        }

        LocalTime now = LocalTime.now().withNano(0);
        attendance.setCheckOutTime(now);
        calculationService.calculateAttendanceMetrics(attendance, attendance.getShift());
        Attendance saved = attendanceRepository.save(attendance);

        return ResponseEntity.ok(Map.of(
                "message", "Clocked out successfully at " + now,
                "checkOutTime", now.toString(),
                "workingMinutes", saved.getWorkingMinutes(),
                "status", saved.getStatus()
        ));
    }

    // 4. Task N-9: Get Daily Attendance by Single Date
    @GetMapping("/daily/{date}")
    public ResponseEntity<List<DailyAttendanceResponse>> getDailyAttendance(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Attendance> records = attendanceRepository.findByAttendanceDate(date);
        List<DailyAttendanceResponse> response = records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // 5. Task S-9: Get Attendance History with Filters (Date Range, Department, Status)
    @GetMapping("/history")
    public ResponseEntity<List<DailyAttendanceResponse>> getAttendanceHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status) {

        LocalDate start = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : LocalDate.now();

        List<Attendance> records = attendanceRepository.findByAttendanceDateBetween(start, end);

        List<DailyAttendanceResponse> filtered = records.stream()
                .map(this::mapToResponse)
                .filter(dto -> department == null || department.isEmpty() || dto.getDepartmentName().equalsIgnoreCase(department))
                .filter(dto -> status == null || status.isEmpty() || dto.getStatus().equalsIgnoreCase(status))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }
}
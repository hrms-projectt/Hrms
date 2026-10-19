package com.hrms.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class DailyAttendanceResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private LocalDate attendanceDate;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String workingHours; // e.g., "7h 30m"
    private String status;       // PRESENT, LATE, HALF_DAY, ABSENT
    private Boolean isLate;
    private Boolean isEarlyExit;

    public DailyAttendanceResponse(Long id, Long employeeId, String employeeName, String departmentName,
                                   LocalDate attendanceDate, LocalTime checkInTime, LocalTime checkOutTime,
                                   Long workingMinutes, String status, Boolean isLate, Boolean isEarlyExit) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.departmentName = departmentName;
        this.attendanceDate = attendanceDate;
        this.checkInTime = checkInTime;
        this.checkOutTime = checkOutTime;
        this.workingHours = formatMinutes(workingMinutes);
        this.status = status;
        this.isLate = isLate;
        this.isEarlyExit = isEarlyExit;
    }

    private String formatMinutes(Long minutes) {
        if (minutes == null || minutes <= 0) return "0h 0m";
        long hrs = minutes / 60;
        long mins = minutes % 60;
        return hrs + "h " + mins + "m";
    }

    // Getters
    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }
    public String getDepartmentName() { return departmentName; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public LocalTime getCheckInTime() { return checkInTime; }
    public LocalTime getCheckOutTime() { return checkOutTime; }
    public String getWorkingHours() { return workingHours; }
    public String getStatus() { return status; }
    public Boolean getIsLate() { return isLate; }
    public Boolean getIsEarlyExit() { return isEarlyExit; }
}
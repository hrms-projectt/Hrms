package com.hrms.backend.service;

import com.hrms.backend.entity.Attendance;
import com.hrms.backend.entity.Shift;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalTime;

@Service
public class AttendanceCalculationService {

    // Default 15-minute grace period allowed after shift start
    public static final int GRACE_PERIOD_MINUTES = 15;
    public static final int HALF_DAY_THRESHOLD_MINUTES = 240; // 4 Hours

    /**
     * Computes working hours, late arrivals, early exits, and attendance status.
     */
    public void calculateAttendanceMetrics(Attendance attendance, Shift shift) {
        if (shift == null) {
            attendance.setStatus("PRESENT");
            return;
        }

        LocalTime checkIn = attendance.getCheckInTime();
        LocalTime checkOut = attendance.getCheckOutTime();
        LocalTime shiftStart = shift.getStartTime();
        LocalTime shiftEnd = shift.getEndTime();

        // 1. Late Arrival Calculation (Shift Start + Grace Period)
        LocalTime graceDeadline = shiftStart.plusMinutes(GRACE_PERIOD_MINUTES);
        boolean isLate = checkIn != null && checkIn.isAfter(graceDeadline);
        attendance.setIsLate(isLate);

        // 2. If employee has not checked out yet
        if (checkOut == null) {
            attendance.setStatus(isLate ? "LATE" : "INCOMPLETE");
            attendance.setWorkingMinutes(0L);
            attendance.setIsEarlyExit(false);
            return;
        }

        // 3. Early Exit Calculation
        boolean isNightShift = shiftEnd.isBefore(shiftStart);
        boolean isEarlyExit;
        if (!isNightShift) {
            isEarlyExit = checkOut.isBefore(shiftEnd);
        } else {
            // Night shift check (e.g., 22:00 to 06:00)
            if (checkOut.isAfter(shiftStart)) {
                isEarlyExit = true; // Exited before midnight
            } else {
                isEarlyExit = checkOut.isBefore(shiftEnd);
            }
        }
        attendance.setIsEarlyExit(isEarlyExit);

        // 4. Total Working Hours Calculation (Excluding Break)
        long totalMinutes = Duration.between(checkIn, checkOut).toMinutes();
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60; // Overnight span
        }

        int breakMinutes = shift.getBreakDurationMinutes() != null ? shift.getBreakDurationMinutes() : 0;
        long netWorkingMinutes = Math.max(0, totalMinutes - breakMinutes);
        attendance.setWorkingMinutes(netWorkingMinutes);

        // 5. Status Resolution
        if (netWorkingMinutes < HALF_DAY_THRESHOLD_MINUTES) {
            attendance.setStatus("HALF_DAY");
        } else if (isLate) {
            attendance.setStatus("LATE");
        } else {
            attendance.setStatus("PRESENT");
        }
    }
}
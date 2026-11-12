package com.hrms.backend.controller;

import com.hrms.backend.entity.AuditLog;
import com.hrms.backend.entity.LeaveBalance;
import com.hrms.backend.entity.LeaveRequest;
import com.hrms.backend.repository.AuditLogRepository;
import com.hrms.backend.repository.LeaveBalanceRepository;
import com.hrms.backend.repository.LeaveRequestRepository;
import com.hrms.backend.repository.UserRepository;
import com.hrms.backend.service.EmailNotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/leaves")
@CrossOrigin(originPatterns = "*")
public class LeaveWorkflowController {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailService;

    public LeaveWorkflowController(LeaveRequestRepository leaveRequestRepository,
                                   LeaveBalanceRepository leaveBalanceRepository,
                                   AuditLogRepository auditLogRepository,
                                   UserRepository userRepository,
                                   EmailNotificationService emailService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // RBAC Check: Only MANAGER, HR_ADMIN, or SUPER_ADMIN can approve/reject
    private boolean canApproveOrReject(Authentication auth) {
        if (auth == null) return false;
        return userRepository.findByEmail(auth.getName())
                .map(u -> u.getRole() != null && (
                        "SUPER_ADMIN".equals(u.getRole().getName()) ||
                        "HR_ADMIN".equals(u.getRole().getName()) ||
                        "MANAGER".equals(u.getRole().getName())
                )).orElse(false);
    }

    // Task S-10: Employee submits a Leave Request
    @PostMapping
    public ResponseEntity<?> applyForLeave(@RequestBody LeaveRequest req) {
        if (req.getEmployeeId() == null || req.getLeaveType() == null || req.getStartDate() == null || req.getEndDate() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId, leaveType, startDate, and endDate are required"));
        }
        if (req.getEndDate().isBefore(req.getStartDate())) {
            return ResponseEntity.badRequest().body(Map.of("message", "End date cannot be earlier than start date"));
        }

        double days = ChronoUnit.DAYS.between(req.getStartDate(), req.getEndDate()) + 1.0;
        req.setTotalDays(days);
        req.setLeaveType(req.getLeaveType().trim().toUpperCase());
        req.setStatus("PENDING");

        LeaveRequest saved = leaveRequestRepository.save(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<LeaveRequest>> getAllLeaves(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(leaveRequestRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase()));
        }
        return ResponseEntity.ok(leaveRequestRepository.findAll());
    }

    // Task N-11 AC 1: POST /api/v1/leaves/{id}/approve updates status to "APPROVED" and deducts balance
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveLeave(@PathVariable Long id,
                                          @RequestBody(required = false) Map<String, String> body,
                                          Authentication auth) {
        if (!canApproveOrReject(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Managers, HR Admin, or Super Admin can approve leaves"));
        }

        LeaveRequest leave = leaveRequestRepository.findById(id).orElse(null);
        if (leave == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Leave request not found"));
        }
        if ("APPROVED".equals(leave.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Leave request is already approved"));
        }

        int year = leave.getStartDate().getYear();
        if (!"UNPAID".equalsIgnoreCase(leave.getLeaveType())) {
            LeaveBalance balance = leaveBalanceRepository
                    .findByEmployeeIdAndLeaveTypeIgnoreCaseAndYear(leave.getEmployeeId(), leave.getLeaveType(), year)
                    .orElse(null);

            if (balance == null || balance.getRemainingBalance() < leave.getTotalDays()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Insufficient leave balance for " + leave.getLeaveType()));
            }

            balance.setUsedLeaves(balance.getUsedLeaves() + leave.getTotalDays());
            balance.setRemainingBalance(balance.getRemainingBalance() - leave.getTotalDays());
            leaveBalanceRepository.save(balance);
        }

        String comment = (body != null) ? body.get("comment") : "Approved";
        String actor = (auth != null) ? auth.getName() : "SYSTEM";

        leave.setStatus("APPROVED");
        leave.setManagerComment(comment);
        leave.setActionedBy(actor);
        LeaveRequest updated = leaveRequestRepository.save(leave);

        auditLogRepository.save(new AuditLog(
                "LEAVE_APPROVED", "LeaveRequest", leave.getId(), actor,
                "Approved " + leave.getTotalDays() + " days of " + leave.getLeaveType() + " for employeeId=" + leave.getEmployeeId()
        ));

        emailService.sendLeaveStatusEmail(
                leave.getEmployeeId(), leave.getLeaveType(),
                leave.getStartDate().toString(), leave.getEndDate().toString(), "APPROVED", comment
        );

        return ResponseEntity.ok(updated);
    }

    // Task N-11 AC 2: POST /api/v1/leaves/{id}/reject updates status to "REJECTED" and restores balance
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectLeave(@PathVariable Long id,
                                         @RequestBody(required = false) Map<String, String> body,
                                         Authentication auth) {
        if (!canApproveOrReject(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Managers, HR Admin, or Super Admin can reject leaves"));
        }

        LeaveRequest leave = leaveRequestRepository.findById(id).orElse(null);
        if (leave == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Leave request not found"));
        }
        if ("REJECTED".equals(leave.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Leave request is already rejected"));
        }

        // Restore balance if it was previously approved/deducted
        if ("APPROVED".equals(leave.getStatus()) && !"UNPAID".equalsIgnoreCase(leave.getLeaveType())) {
            int year = leave.getStartDate().getYear();
            leaveBalanceRepository
                    .findByEmployeeIdAndLeaveTypeIgnoreCaseAndYear(leave.getEmployeeId(), leave.getLeaveType(), year)
                    .ifPresent(balance -> {
                        balance.setUsedLeaves(Math.max(0.0, balance.getUsedLeaves() - leave.getTotalDays()));
                        balance.setRemainingBalance(balance.getRemainingBalance() + leave.getTotalDays());
                        leaveBalanceRepository.save(balance);
                    });
        }

        String comment = (body != null) ? body.get("comment") : "Rejected";
        String actor = (auth != null) ? auth.getName() : "SYSTEM";

        leave.setStatus("REJECTED");
        leave.setManagerComment(comment);
        leave.setActionedBy(actor);
        LeaveRequest updated = leaveRequestRepository.save(leave);

        auditLogRepository.save(new AuditLog(
                "LEAVE_REJECTED", "LeaveRequest", leave.getId(), actor,
                "Rejected " + leave.getTotalDays() + " days of " + leave.getLeaveType() + " for employeeId=" + leave.getEmployeeId()
        ));

        emailService.sendLeaveStatusEmail(
                leave.getEmployeeId(), leave.getLeaveType(),
                leave.getStartDate().toString(), leave.getEndDate().toString(), "REJECTED", comment
        );

        return ResponseEntity.ok(updated);
    }
}
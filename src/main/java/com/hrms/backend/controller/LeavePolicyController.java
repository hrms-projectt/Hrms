package com.hrms.backend.controller;

import com.hrms.backend.entity.LeaveBalance;
import com.hrms.backend.entity.LeavePolicy;
import com.hrms.backend.repository.EmployeeRepository;
import com.hrms.backend.repository.LeaveBalanceRepository;
import com.hrms.backend.repository.LeavePolicyRepository;
import com.hrms.backend.repository.UserRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(originPatterns = "*")
public class LeavePolicyController {

    private final LeavePolicyRepository policyRepository;
    private final LeaveBalanceRepository balanceRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public LeavePolicyController(LeavePolicyRepository policyRepository,
                                 LeaveBalanceRepository balanceRepository,
                                 EmployeeRepository employeeRepository,
                                 UserRepository userRepository) {
        this.policyRepository = policyRepository;
        this.balanceRepository = balanceRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        return userRepository.findByEmail(auth.getName())
                .map(u -> u.getRole() != null &&
                        ("SUPER_ADMIN".equals(u.getRole().getName()) || "HR_ADMIN".equals(u.getRole().getName())))
                .orElse(false);
    }

    // AC 1: POST /api/v1/leave/policies creates a new policy
    @PostMapping("/leave/policies")
    public ResponseEntity<?> createPolicy(@RequestBody LeavePolicy policy, Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only HR Admin or Super Admin can create leave policies"));
        }
        if (policy.getLeaveType() == null || policy.getLeaveType().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "leaveType is required"));
        }
        if (policy.getAnnualQuota() == null || policy.getAnnualQuota() < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "annualQuota must be 0 or greater"));
        }

        String normalizedType = policy.getLeaveType().trim().toUpperCase();
        if (policyRepository.existsByLeaveTypeIgnoreCase(normalizedType)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Leave policy already exists for type: " + normalizedType));
        }

        policy.setLeaveType(normalizedType);
        return ResponseEntity.status(HttpStatus.CREATED).body(policyRepository.save(policy));
    }

    @GetMapping("/leave/policies")
    public ResponseEntity<List<LeavePolicy>> getAllPolicies() {
        return ResponseEntity.ok(policyRepository.findAll());
    }

    // AC 2 & 3: GET /api/v1/employees/{id}/leave-balances (Auto-initializes & prorates for mid-year joiners)
    @GetMapping("/employees/{id}/leave-balances")
    public ResponseEntity<?> getEmployeeLeaveBalances(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate joiningDate) {

        if (!employeeRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Employee not found"));
        }

        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> existingBalances = balanceRepository.findByEmployeeIdAndYear(id, currentYear);

        if (!existingBalances.isEmpty()) {
            return ResponseEntity.ok(existingBalances);
        }

        // Auto-initialize prorated balances based on joining date if not yet initialized
        LocalDate effectiveJoinDate = (joiningDate != null) ? joiningDate : LocalDate.of(currentYear, 1, 1);
        int remainingMonthsInYear = (effectiveJoinDate.getYear() == currentYear)
                ? (12 - effectiveJoinDate.getMonthValue() + 1)
                : 12;

        List<LeavePolicy> policies = policyRepository.findAll();
        List<LeaveBalance> createdBalances = new ArrayList<>();

        for (LeavePolicy policy : policies) {
            double proratedQuota = Math.round(((policy.getAnnualQuota() / 12.0) * remainingMonthsInYear) * 2.0) / 2.0;

            LeaveBalance lb = new LeaveBalance();
            lb.setEmployeeId(id);
            lb.setLeaveType(policy.getLeaveType());
            lb.setYear(currentYear);
            lb.setTotalAllocated(proratedQuota);
            lb.setUsedLeaves(0.0);
            lb.setRemainingBalance(proratedQuota);
            createdBalances.add(balanceRepository.save(lb));
        }

        return ResponseEntity.ok(createdBalances);
    }
}
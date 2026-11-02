package com.hrms.backend.controller;

import com.hrms.backend.entity.*;
import com.hrms.backend.repository.*;
import com.hrms.backend.service.PayrollProcessingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payroll")
@CrossOrigin(originPatterns = "*")
public class PayrollController {

    private final SalaryComponentRepository componentRepository;
    private final SalaryStructureRepository structureRepository;
    private final PayrollRepository payrollRepository;
    private final AuditLogRepository auditLogRepository;
    private final PayrollProcessingService payrollService;

    public PayrollController(SalaryComponentRepository componentRepository,
                             SalaryStructureRepository structureRepository,
                             PayrollRepository payrollRepository,
                             AuditLogRepository auditLogRepository,
                             PayrollProcessingService payrollService) {
        this.componentRepository = componentRepository;
        this.structureRepository = structureRepository;
        this.payrollRepository = payrollRepository;
        this.auditLogRepository = auditLogRepository;
        this.payrollService = payrollService;
    }

    // Task N-12 AC 1: POST /api/v1/payroll/components creates a new component
    @PostMapping("/components")
    public ResponseEntity<?> createComponent(@RequestBody SalaryComponent component) {
        if (component.getName() == null || component.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Component name is required"));
        }
        if (componentRepository.existsByNameIgnoreCase(component.getName().trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Salary component already exists"));
        }
        component.setName(component.getName().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(componentRepository.save(component));
    }

    @GetMapping("/components")
    public ResponseEntity<List<SalaryComponent>> getAllComponents() {
        return ResponseEntity.ok(componentRepository.findAll());
    }

    // Task N-12 AC 2 & 3: POST /api/v1/payroll/structure assigns components & validates sum
    @PostMapping("/structure")
    public ResponseEntity<?> saveSalaryStructure(@RequestBody SalaryStructure structure) {
        if (structure.getDesignation() == null || structure.getDesignation().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Designation is required"));
        }
        if (structure.getComponents() == null || structure.getComponents().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "At least one salary component is required"));
        }

        double calculatedSum = structure.getComponents().values().stream()
                .mapToDouble(Double::doubleValue)
                .sum();

        if (structure.getTotalEarnings() != null && Math.abs(structure.getTotalEarnings() - calculatedSum) > 0.01) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Validation failed: totalEarnings (" + structure.getTotalEarnings() +
                            ") does not equal sum of components (" + calculatedSum + ")"
            ));
        }

        structure.setTotalEarnings(calculatedSum);
        return ResponseEntity.status(HttpStatus.CREATED).body(structureRepository.save(structure));
    }

    @GetMapping("/structure")
    public ResponseEntity<List<SalaryStructure>> getAllStructures() {
        return ResponseEntity.ok(structureRepository.findAll());
    }

    // Task N-15 & S-15: POST /api/v1/payroll/process/{month} triggers batch payroll calculation
    @PostMapping("/process/{month}")
    public ResponseEntity<?> processPayroll(@PathVariable String month) {
        List<Payroll> results = payrollService.processMonthlyPayroll(month);
        return ResponseEntity.ok(Map.of(
                "message", "Payroll processed in Draft status for " + month,
                "totalEmployeesProcessed", results.size(),
                "records", results
        ));
    }

    // Task T-15: Fetch Draft Preview Table for a Month
    @GetMapping("/draft/{month}")
    public ResponseEntity<List<Payroll>> getDraftPayrolls(@PathVariable String month) {
        return ResponseEntity.ok(payrollRepository.findByPayrollMonth(month));
    }

    // Task T-15: Manual Override & Recalculate with Audit Log
    @PutMapping("/{id}/adjust")
    public ResponseEntity<?> manualAdjustment(@PathVariable Long id,
                                              @RequestBody Map<String, Double> adjustments,
                                              Authentication auth) {
        Payroll payroll = payrollRepository.findById(id).orElse(null);
        if (payroll == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Payroll record not found"));
        }

        Double newGross = adjustments.getOrDefault("grossSalary", payroll.getGrossSalary());
        Double newDeductions = adjustments.getOrDefault("totalDeductions", payroll.getTotalDeductions());
        double newNet = Math.max(0.0, newGross - newDeductions);

        payroll.setGrossSalary(newGross);
        payroll.setTotalDeductions(newDeductions);
        payroll.setNetSalary(newNet);
        Payroll updated = payrollRepository.save(payroll);

        String actor = (auth != null) ? auth.getName() : "FINANCE_ADMIN";
        auditLogRepository.save(new AuditLog(
                "PAYROLL_MANUAL_ADJUSTMENT", "Payroll", payroll.getId(), actor,
                "Adjusted Gross=" + newGross + ", Deductions=" + newDeductions + ", Net=" + newNet
        ));

        return ResponseEntity.ok(updated);
    }
}
package com.hrms.backend.controller;

import com.hrms.backend.entity.Department;
import com.hrms.backend.repository.DepartmentRepository;
import com.hrms.backend.repository.ShiftRepository;
import com.hrms.backend.repository.UserRepository;
import com.hrms.backend.service.DepartmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/departments")
@CrossOrigin(originPatterns = "*")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final DepartmentRepository departmentRepository;
    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;

    public DepartmentController(DepartmentService departmentService, 
                                DepartmentRepository departmentRepository, 
                                ShiftRepository shiftRepository, 
                                UserRepository userRepository) {
        this.departmentService = departmentService;
        this.departmentRepository = departmentRepository;
        this.shiftRepository = shiftRepository;
        this.userRepository = userRepository;
    }

    // Role validation helper (Requires SUPER_ADMIN or HR_ADMIN)
    private boolean canEdit(Authentication auth) {
        if (auth == null) return false;
        return userRepository.findByEmail(auth.getName())
                .map(u -> u.getRole() != null
                        && ("SUPER_ADMIN".equals(u.getRole().getName()) || "HR_ADMIN".equals(u.getRole().getName())))
                .orElse(false);
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        Department savedDepartment = departmentService.saveDepartment(department);
        return ResponseEntity.ok(savedDepartment);
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping("/{id}/assign-shift")
    public ResponseEntity<?> assignShiftToDepartment(
            @PathVariable Long id, 
            @RequestBody Map<String, Long> payload, 
            Authentication auth) {
        
        if (!canEdit(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only HR Admin or Super Admin can assign shifts"));
        }
        
        Long shiftId = payload.get("shiftId");
        if (shiftId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "shiftId is required"));
        }

        return departmentRepository.findById(id).map(department -> {
            return shiftRepository.findById(shiftId).map(shift -> {
                department.setDefaultShift(shift);
                departmentRepository.save(department);
                return ResponseEntity.ok(Map.of("message", "Shift successfully assigned to Department: " + department.getName()));
            }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Shift not found")));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Department not found")));
    }
}
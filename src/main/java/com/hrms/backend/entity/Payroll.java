package com.hrms.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payroll", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "payroll_month"})
})
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String employeeName;

    @Column(name = "payroll_month", nullable = false)
    private String payrollMonth; // e.g., "2026-10"

    @Column(nullable = false)
    private Double grossSalary = 0.0;

    @Column(nullable = false)
    private Double totalDeductions = 0.0;

    @Column(nullable = false)
    private Double lopDeduction = 0.0;

    @Column(nullable = false)
    private Double netSalary = 0.0;

    @Column(nullable = false)
    private String status = "Draft"; // Draft, Locked, Paid

    @OneToMany(mappedBy = "payroll", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PayrollItem> items = new ArrayList<>();

    private LocalDateTime processedAt = LocalDateTime.now();

    public Payroll() {}

    public void addItem(PayrollItem item) {
        items.add(item);
        item.setPayroll(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getPayrollMonth() { return payrollMonth; }
    public void setPayrollMonth(String payrollMonth) { this.payrollMonth = payrollMonth; }
    public Double getGrossSalary() { return grossSalary; }
    public void setGrossSalary(Double grossSalary) { this.grossSalary = grossSalary; }
    public Double getTotalDeductions() { return totalDeductions; }
    public void setTotalDeductions(Double totalDeductions) { this.totalDeductions = totalDeductions; }
    public Double getLopDeduction() { return lopDeduction; }
    public void setLopDeduction(Double lopDeduction) { this.lopDeduction = lopDeduction; }
    public Double getNetSalary() { return netSalary; }
    public void setNetSalary(Double netSalary) { this.netSalary = netSalary; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<PayrollItem> getItems() { return items; }
    public void setItems(List<PayrollItem> items) { this.items = items; }
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}
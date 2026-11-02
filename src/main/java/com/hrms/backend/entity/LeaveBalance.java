package com.hrms.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_balances", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "leave_type", "year"})
})
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "leave_type", nullable = false)
    private String leaveType;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Double totalAllocated = 0.0;

    @Column(nullable = false)
    private Double usedLeaves = 0.0;

    @Column(nullable = false)
    private Double remainingBalance = 0.0;

    public LeaveBalance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Double getTotalAllocated() { return totalAllocated; }
    public void setTotalAllocated(Double totalAllocated) { this.totalAllocated = totalAllocated; }
    public Double getUsedLeaves() { return usedLeaves; }
    public void setUsedLeaves(Double usedLeaves) { this.usedLeaves = usedLeaves; }
    public Double getRemainingBalance() { return remainingBalance; }
    public void setRemainingBalance(Double remainingBalance) { this.remainingBalance = remainingBalance; }
}
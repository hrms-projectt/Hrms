package com.hrms.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_policies")
public class LeavePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String leaveType; // e.g., "CASUAL", "SICK", "EARNED", "UNPAID"

    @Column(nullable = false)
    private Integer annualQuota; // e.g., 12

    @Column(nullable = false)
    private Boolean carryForwardAllowed = false;

    public LeavePolicy() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
    public Integer getAnnualQuota() { return annualQuota; }
    public void setAnnualQuota(Integer annualQuota) { this.annualQuota = annualQuota; }
    public Boolean getCarryForwardAllowed() { return carryForwardAllowed; }
    public void setCarryForwardAllowed(Boolean carryForwardAllowed) { this.carryForwardAllowed = carryForwardAllowed; }
}
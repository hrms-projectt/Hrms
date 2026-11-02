package com.hrms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "payroll_items")
public class PayrollItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false)
    @JsonIgnore
    private Payroll payroll;

    @Column(nullable = false)
    private String componentName; // Basic, HRA, Employee PF, ESI, LOP, etc.

    @Column(nullable = false)
    private String componentType; // EARNING, DEDUCTION, STATUTORY_EMPLOYER

    @Column(nullable = false)
    private Double amount = 0.0;

    public PayrollItem() {}

    public PayrollItem(String componentName, String componentType, Double amount) {
        this.componentName = componentName;
        this.componentType = componentType;
        this.amount = amount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Payroll getPayroll() { return payroll; }
    public void setPayroll(Payroll payroll) { this.payroll = payroll; }
    public String getComponentName() { return componentName; }
    public void setComponentName(String componentName) { this.componentName = componentName; }
    public String getComponentType() { return componentType; }
    public void setComponentType(String componentType) { this.componentType = componentType; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
}
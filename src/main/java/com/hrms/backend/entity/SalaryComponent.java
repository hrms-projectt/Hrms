package com.hrms.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "salary_component")
public class SalaryComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "Basic Salary", "HRA", "Conveyance", "Special Allowance"

    @Column(nullable = false)
    private String type = "EARNING"; // EARNING or DEDUCTION

    @Column(nullable = false)
    private String calculationType = "FIXED"; // FIXED or PERCENTAGE_OF_BASIC

    @Column(nullable = false)
    private Double defaultValue = 0.0;

    public SalaryComponent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCalculationType() { return calculationType; }
    public void setCalculationType(String calculationType) { this.calculationType = calculationType; }
    public Double getDefaultValue() { return defaultValue; }
    public void setDefaultValue(Double defaultValue) { this.defaultValue = defaultValue; }
}
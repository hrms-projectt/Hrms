package com.hrms.backend.entity;

import jakarta.persistence.*;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "salary_structure")
public class SalaryStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String designation; // e.g., "Software Engineer"

    @Column(nullable = false)
    private Double totalEarnings;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "salary_structure_components", joinColumns = @JoinColumn(name = "structure_id"))
    @MapKeyColumn(name = "component_name")
    @Column(name = "amount")
    private Map<String, Double> components = new HashMap<>();

    public SalaryStructure() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public Double getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(Double totalEarnings) { this.totalEarnings = totalEarnings; }
    public Map<String, Double> getComponents() { return components; }
    public void setComponents(Map<String, Double> components) { this.components = components; }
}
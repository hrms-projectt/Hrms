package com.hrms.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g., "LEAVE_APPROVED", "LEAVE_REJECTED", "PAYROLL_ADJUSTED"

    @Column(nullable = false)
    private String entityType; // e.g., "LeaveRequest", "Payroll"

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private String performedBy;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String action, String entityType, Long entityId, String performedBy, String details) {
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.performedBy = performedBy;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getPerformedBy() { return performedBy; }
    public String getDetails() { return details; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
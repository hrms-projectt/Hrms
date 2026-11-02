package com.hrms.backend.repository;

import com.hrms.backend.entity.SalaryComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaryComponentRepository extends JpaRepository<SalaryComponent, Long> {
    boolean existsByNameIgnoreCase(String name);
}
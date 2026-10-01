package com.hrms.backend.controller;

import com.hrms.backend.entity.Organization;
import com.hrms.backend.entity.User;
import com.hrms.backend.repository.OrganizationRepository;
import com.hrms.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
// UPDATED BASE ROUTE to include /v1/
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    // Inject UserRepository to validate the Super Admin requirement
    public OrganizationController(OrganizationRepository organizationRepository, UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    // REVERTED TO @RequestBody FOR JSON PAYLOAD
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrganization(@RequestBody Organization organization) {
        
        // TASK N-3 VALIDATION: Check if a Super Admin exists for this organization
        // Assuming the 'contactEmail' provided in the form corresponds to the Admin's login email
        Optional<User> adminUserOpt = userRepository.findByEmail(organization.getContactEmail());
        
        if (adminUserOpt.isEmpty() || !"SUPER_ADMIN".equals(adminUserOpt.get().getRole())) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Validation Failed: A valid SUPER_ADMIN user must exist with the provided contact email before creating the organization.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        // Save the organization (including the S3 logoUrl sent from the frontend)
        Organization savedOrg = organizationRepository.save(organization);

        // Build the success response matching Srilekha's request
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Organization created successfully");
        response.put("id", savedOrg.getId());

        return ResponseEntity.ok(response);
    }

    // ADDED NEW ENDPOINT: Fetch a single organization by ID (Task N-3)
    @GetMapping("/{id}")
    public ResponseEntity<Organization> getOrganizationById(@PathVariable Long id) {
        return organizationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // EXISTING ENDPOINT: Get all organizations
    @GetMapping
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(organizationRepository.findAll());
    }

    // ADDED UPDATE ENDPOINT: For future edits
    @PutMapping("/{id}")
    public ResponseEntity<Organization> updateOrganization(@PathVariable Long id, @RequestBody Organization orgDetails) {
        return organizationRepository.findById(id)
                .map(existingOrg -> {
                    existingOrg.setName(orgDetails.getName());
                    existingOrg.setLogoUrl(orgDetails.getLogoUrl()); // Now an S3 URL string
                    existingOrg.setAddress(orgDetails.getAddress());
                    existingOrg.setContactEmail(orgDetails.getContactEmail());
                    return ResponseEntity.ok(organizationRepository.save(existingOrg));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
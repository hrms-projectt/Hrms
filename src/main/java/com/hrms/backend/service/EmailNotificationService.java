package com.hrms.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    @Value("${aws.ses.sender-email:noreply@hrms.com}")
    private String senderEmail;

    public void sendLeaveStatusEmail(Long employeeId, String leaveType, String startDate, String endDate, String status, String comment) {
        String subject = "HRMS Leave Update: Your " + leaveType + " request has been " + status;
        String body = String.format(
                "Hello Employee #%d, your %s leave from %s to %s was %s. Comment: %s",
                employeeId, leaveType, startDate, endDate, status, (comment != null ? comment : "N/A")
        );
        log.info("[AWS SES Trigger] From: {} | Subject: {} | Body: {}", senderEmail, subject, body);
    }
}
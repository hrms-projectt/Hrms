package com.hrms.backend.service;

import com.hrms.backend.entity.*;
import com.hrms.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PayrollProcessingService {

    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository structureRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PayrollRepository payrollRepository;

    public PayrollProcessingService(EmployeeRepository employeeRepository,
                                    SalaryStructureRepository structureRepository,
                                    LeaveRequestRepository leaveRequestRepository,
                                    PayrollRepository payrollRepository) {
        this.employeeRepository = employeeRepository;
        this.structureRepository = structureRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.payrollRepository = payrollRepository;
    }

    @Transactional
    public List<Payroll> processMonthlyPayroll(String monthStr) {
        YearMonth ym;
        try {
            ym = YearMonth.parse(monthStr); // Expects "YYYY-MM", e.g., "2026-10"
        } catch (Exception e) {
            ym = YearMonth.now();
        }

        LocalDate startOfMonth = ym.atDay(1);
        LocalDate endOfMonth = ym.atEndOfMonth();
        double workingDaysInMonth = 26.0;

        List<Employee> employees = employeeRepository.findAll();
        List<Payroll> processedPayrolls = new ArrayList<>();

        // Check if a default SalaryStructure exists; otherwise use standard fallback breakdown
        SalaryStructure defaultStructure = structureRepository.findAll().stream().findFirst().orElse(null);

        for (Employee emp : employees) {
            Payroll payroll = payrollRepository
                    .findByEmployeeIdAndPayrollMonth(emp.getId(), monthStr)
                    .orElse(new Payroll());

            payroll.getItems().clear();
            payroll.setEmployeeId(emp.getId());
            payroll.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
            payroll.setPayrollMonth(monthStr);
            payroll.setStatus("Draft");

            // 1. Determine Earnings Breakdown (Basic, HRA, Special Allowance)
            double basic = 15000.0;
            double hra = 6000.0;
            double allowances = 4000.0;

            if (defaultStructure != null && !defaultStructure.getComponents().isEmpty()) {
                Map<String, Double> comps = defaultStructure.getComponents();
                basic = comps.getOrDefault("Basic Salary", comps.getOrDefault("Basic", 15000.0));
                hra = comps.getOrDefault("HRA", basic * 0.40);
                allowances = Math.max(0.0, defaultStructure.getTotalEarnings() - (basic + hra));
            }

            double gross = basic + hra + allowances;

            payroll.addItem(new PayrollItem("Basic Salary", "EARNING", basic));
            payroll.addItem(new PayrollItem("HRA", "EARNING", hra));
            if (allowances > 0) {
                payroll.addItem(new PayrollItem("Special Allowance", "EARNING", allowances));
            }

            // 2. Calculate Unpaid Leave (LOP) Days for the month (Task P-2)
            List<LeaveRequest> unpaidLeaves = leaveRequestRepository
                    .findByEmployeeIdAndStatusAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
                            emp.getId(), "APPROVED", startOfMonth, endOfMonth);

            double unpaidDays = unpaidLeaves.stream()
                    .filter(l -> "UNPAID".equalsIgnoreCase(l.getLeaveType()))
                    .mapToDouble(LeaveRequest::getTotalDays)
                    .sum();

            double lopDeduction = Math.round(((basic / workingDaysInMonth) * unpaidDays) * 100.0) / 100.0;

            // 3. Statutory Calculations (Task P-4: PF = 12% of Basic, ESI = 1.75% if Gross < 21000)
            double employeePf = Math.round((basic * 0.12) * 100.0) / 100.0;
            double employerPf = Math.round((basic * 0.12) * 100.0) / 100.0;
            double employeeEsi = (gross < 21000.0) ? Math.round((gross * 0.0175) * 100.0) / 100.0 : 0.0;
            double professionalTax = (gross > 15000.0) ? 200.0 : 0.0;

            payroll.addItem(new PayrollItem("Employee PF (12%)", "DEDUCTION", employeePf));
            payroll.addItem(new PayrollItem("Employer PF (12%)", "STATUTORY_EMPLOYER", employerPf));
            if (employeeEsi > 0) {
                payroll.addItem(new PayrollItem("Employee ESI (1.75%)", "DEDUCTION", employeeEsi));
            }
            if (professionalTax > 0) {
                payroll.addItem(new PayrollItem("Professional Tax", "DEDUCTION", professionalTax));
            }
            if (lopDeduction > 0) {
                payroll.addItem(new PayrollItem("Loss of Pay (LOP)", "DEDUCTION", lopDeduction));
            }

            // 4. Net Salary Resolution with Zero Floor (Task P-7)
            double totalDeductions = employeePf + employeeEsi + professionalTax + lopDeduction;
            double netSalary = Math.max(0.0, Math.round((gross - totalDeductions) * 100.0) / 100.0);

            payroll.setGrossSalary(gross);
            payroll.setLopDeduction(lopDeduction);
            payroll.setTotalDeductions(totalDeductions);
            payroll.setNetSalary(netSalary);

            processedPayrolls.add(payrollRepository.save(payroll));
        }

        return processedPayrolls;
    }
}
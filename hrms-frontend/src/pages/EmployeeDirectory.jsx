import { useState } from "react";

function EmployeeDirectory() {
  const [searchTerm, setSearchTerm] = useState("");

  // Employee data will be connected to the backend later.
  const employees = [];

  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.toLowerCase();

    return (
      employee.employeeId?.toLowerCase().includes(search) ||
      employee.name?.toLowerCase().includes(search) ||
      employee.department?.toLowerCase().includes(search) ||
      employee.designation?.toLowerCase().includes(search) ||
      employee.status?.toLowerCase().includes(search)
    );
  });

  const handleView = (employee) => {
    console.log("View employee:", employee);
  };

  const handleEdit = (employee) => {
    console.log("Edit employee:", employee);
  };

  return (
    <div className="directory-container">
      <div className="directory-card">
        <div className="directory-header">
          <div>
            <h1>Employee Directory</h1>
            <p>
              View and manage employees in the organization.
            </p>
          </div>
        </div>

        <div className="employee-search">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="no-employees"
                  >
                    No Employees Found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td>{employee.employeeId}</td>
                    <td>{employee.name}</td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>
                      <span
                        className={`status ${employee.status
                          ?.toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="view-button"
                          onClick={() =>
                            handleView(employee)
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="edit-button"
                          onClick={() =>
                            handleEdit(employee)
                          }
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDirectory;
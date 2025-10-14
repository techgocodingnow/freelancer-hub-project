export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const cell = row[header];
          // Handle null/undefined
          if (cell === null || cell === undefined) {
            return "";
          }
          // Convert to string and escape quotes
          const cellStr = String(cell).replace(/"/g, '""');
          // Wrap in quotes if contains comma, newline, or quote
          if (cellStr.includes(",") || cellStr.includes("\n") || cellStr.includes('"')) {
            return `"${cellStr}"`;
          }
          return cellStr;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatCustomersForExport = (customers: any[]) => {
  return customers.map((customer) => ({
    Name: customer.name,
    Company: customer.company || "",
    Email: customer.email || "",
    Phone: customer.phone || "",
    "Address Line 1": customer.addressLine1 || "",
    "Address Line 2": customer.addressLine2 || "",
    City: customer.city || "",
    State: customer.state || "",
    "Postal Code": customer.postalCode || "",
    Country: customer.country || "",
    Status: customer.isActive ? "Active" : "Inactive",
    Projects: customer.projects?.length || 0,
    Invoices: customer.invoices?.length || 0,
    "Created At": new Date(customer.createdAt).toLocaleDateString(),
  }));
};

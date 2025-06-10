// Type definitions for jspdf-autotable
declare module 'jspdf-autotable' {
  // This module extends jsPDF with autoTable functionality
  // The actual functionality is added as a side effect when imported
}

// Extend jsPDF type to include autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: any): jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
} 
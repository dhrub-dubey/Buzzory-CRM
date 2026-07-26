import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function downloadInvoicePdf(invoice) {

  const element = document.getElementById("invoice-pdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(
    imgData,
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight
  );

  pdf.save(`${invoice.invoice_number || "invoice"}.pdf`);
}


export function getInvoicePdfBytes(invoice) {
  // temporarily remove ZIP support
  return null;
}
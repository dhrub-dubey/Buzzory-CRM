import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateInvoicePdf(element) {
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

  return pdf;
}


export async function downloadInvoicePdf(element, invoice) {
  const pdf = await generateInvoicePdf(element);

  pdf.save(`${invoice.invoice_number || "invoice"}.pdf`);
}


// NEW: returns bytes for ZIP
export async function getInvoicePdfBytes(element) {
  const pdf = await generateInvoicePdf(element);

  return new Uint8Array(
    pdf.output("arraybuffer")
  );
}
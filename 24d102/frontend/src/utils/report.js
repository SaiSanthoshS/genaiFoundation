import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportAnalysisPdf({ reportRootId, title, summary, request }) {
  const reportElement = document.getElementById(reportRootId);
  if (!reportElement) {
    throw new Error("Report content was not found.");
  }

  const canvas = await html2canvas(reportElement, {
    scale: 2,
    backgroundColor: "#f5f2eb",
    useCORS: true
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, 14, 16);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(
    `${request.baseCurrency}/${request.targetCurrency} | ${request.startDate} to ${request.endDate}`,
    14,
    24
  );

  const wrappedSummary = pdf.splitTextToSize(summary, 180);
  pdf.text(wrappedSummary, 14, 31);

  const yOffset = 40 + wrappedSummary.length * 4;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const printableWidth = pageWidth - 28;
  const imageHeight = (canvas.height * printableWidth) / canvas.width;

  pdf.addImage(imageData, "PNG", 14, yOffset, printableWidth, imageHeight, undefined, "FAST");
  pdf.save("historical-currency-inflation-report.pdf");
}

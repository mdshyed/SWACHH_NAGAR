const PDFDocument = require('pdfkit');
const Complaint = require('../models/Complaint.model');

const generateReport = async (res) => {
  // Gather data
  const [total, resolved, pending, inProgress, escalated, rejected, byCategory, byWard] = await Promise.all([
    Complaint.countDocuments({ isDeleted: false }),
    Complaint.countDocuments({ status: 'resolved', isDeleted: false }),
    Complaint.countDocuments({ status: 'pending', isDeleted: false }),
    Complaint.countDocuments({ status: 'in_progress', isDeleted: false }),
    Complaint.countDocuments({ status: 'escalated', isDeleted: false }),
    Complaint.countDocuments({ status: 'rejected', isDeleted: false }),
    Complaint.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $match: { isDeleted: false, ward: { $exists: true, $ne: null } } },
      { $group: { _id: '$ward', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $lookup: { from: 'wards', localField: '_id', foreignField: '_id', as: 'ward' } },
      { $unwind: { path: '$ward', preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Build PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="swachh-nagar-report-${Date.now()}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width - 100; // usable width

  // ── Header ──────────────────────────────────────────────
  doc.rect(50, 40, W, 60).fill('#16a34a');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('Swachh Nagar', 60, 55);
  doc.fontSize(11).font('Helvetica').text('Complaints Report', 60, 82);
  doc.text(`Generated: ${generatedAt}`, 350, 82, { align: 'right', width: W - 300 });

  doc.fillColor('#111827').moveDown(4);

  // ── Summary table ───────────────────────────────────────
  doc.fontSize(14).font('Helvetica-Bold').text('Summary', 50, 120);
  doc.moveTo(50, 138).lineTo(50 + W, 138).strokeColor('#e5e7eb').stroke();

  const summaryRows = [
    ['Total Complaints', total],
    ['Resolved', `${resolved} (${resolutionRate}%)`],
    ['Pending', pending],
    ['In Progress', inProgress],
    ['Escalated', escalated],
    ['Rejected', rejected],
  ];

  let y = 145;
  summaryRows.forEach(([label, value], i) => {
    if (i % 2 === 0) doc.rect(50, y, W, 22).fill('#f9fafb');
    doc.fillColor('#374151').fontSize(11).font('Helvetica').text(label, 60, y + 6);
    doc.font('Helvetica-Bold').text(String(value), 300, y + 6);
    y += 22;
  });

  // ── Category breakdown ──────────────────────────────────
  y += 20;
  doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('Complaints by Category', 50, y);
  y += 18;
  doc.moveTo(50, y).lineTo(50 + W, y).strokeColor('#e5e7eb').stroke();
  y += 8;

  byCategory.forEach((row, i) => {
    if (i % 2 === 0) doc.rect(50, y, W, 20).fill('#f9fafb');
    const label = row._id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const barWidth = Math.round((row.count / (total || 1)) * (W - 150));
    doc.fillColor('#374151').fontSize(10).font('Helvetica').text(label, 60, y + 5, { width: 160 });
    doc.rect(225, y + 7, barWidth, 8).fill('#16a34a');
    doc.font('Helvetica-Bold').fillColor('#111827').text(String(row.count), 230 + barWidth + 4, y + 5);
    y += 20;
    if (y > 720) { doc.addPage(); y = 50; }
  });

  // ── Ward-wise data ──────────────────────────────────────
  if (byWard.length > 0) {
    y += 20;
    if (y > 660) { doc.addPage(); y = 50; }
    doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('Ward-wise Data', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(50 + W, y).strokeColor('#e5e7eb').stroke();
    y += 8;

    // Header row
    doc.rect(50, y, W, 20).fill('#16a34a');
    doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
    doc.text('Ward', 60, y + 5);
    doc.text('Total', 250, y + 5);
    doc.text('Resolved', 320, y + 5);
    doc.text('Rate', 400, y + 5);
    y += 20;

    byWard.forEach((row, i) => {
      if (i % 2 === 0) doc.rect(50, y, W, 20).fill('#f9fafb');
      const wardName = row.ward?.wardName?.en || `Ward ${row._id}`;
      const rate = row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 0;
      doc.fillColor('#374151').fontSize(10).font('Helvetica');
      doc.text(wardName, 60, y + 5, { width: 180 });
      doc.text(String(row.total), 250, y + 5);
      doc.text(String(row.resolved), 320, y + 5);
      doc.fillColor(rate >= 70 ? '#16a34a' : rate >= 40 ? '#d97706' : '#dc2626')
        .font('Helvetica-Bold').text(`${rate}%`, 400, y + 5);
      y += 20;
      if (y > 720) { doc.addPage(); y = 50; }
    });
  }

  // ── Footer ───────────────────────────────────────────────
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica')
    .text('Swachh Nagar Civic Platform · Confidential', 50, 780, { align: 'center', width: W });

  doc.end();
};

module.exports = { generateReport };

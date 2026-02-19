import { jsPDF } from 'jspdf';
import type { Album, Track } from './types';

export async function generateBooklet(album: Album, tracks: Track[]): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;

  // Cover page
  if (album.cover_image_url) {
    try {
      const res = await fetch(album.cover_image_url);
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      const imgSize = 100;
      doc.addImage(dataUrl, 'JPEG', (pageW - imgSize) / 2, 30, imgSize, imgSize);
    } catch {
      // Skip cover if CORS or fetch fails
    }
  }

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(album.title, pageW / 2, 150, { align: 'center' });

  if (album.tagline) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text(album.tagline, pageW / 2, 162, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Made with Libretto', pageW / 2, 280, { align: 'center' });

  // Track listing page
  doc.addPage();
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Track Listing', margin, 30);

  let y = 45;
  const completeTracks = tracks.filter(t => t.status === 'complete');
  for (const track of completeTracks) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${track.track_number}. ${track.title}`, margin, y);
    y += 6;
    if (track.duration) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const mins = Math.floor(track.duration / 60);
      const secs = Math.floor(track.duration % 60);
      doc.text(`${mins}:${secs.toString().padStart(2, '0')}`, margin + 4, y);
      y += 4;
    }
    if (track.style_prompt) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(track.style_prompt, margin + 4, y, { maxWidth: contentW - 8 });
      y += 8;
    }
    y += 4;
  }

  // Lyrics pages (one per track)
  for (const track of completeTracks) {
    if (!track.lyrics) continue;

    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${track.track_number}. ${track.title}`, margin, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(track.lyrics, contentW);
    let ly = 36;
    for (const line of lines) {
      if (ly > 275) {
        doc.addPage();
        ly = 25;
      }
      doc.text(line, margin, ly);
      ly += 4.5;
    }
  }

  // Biography page
  if (album.biography_markdown) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('The Story', margin, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    // Strip markdown formatting for PDF
    const plainBio = album.biography_markdown
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/---/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const bioLines = doc.splitTextToSize(plainBio, contentW);
    let by = 36;
    for (const line of bioLines) {
      if (by > 275) {
        doc.addPage();
        by = 25;
      }
      doc.text(line, margin, by);
      by += 4.5;
    }
  }

  return doc.output('blob');
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

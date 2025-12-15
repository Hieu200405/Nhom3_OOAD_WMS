import jsPDF from 'jspdf';

let fontPromise;

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkString = '';
    for (let j = 0; j < chunk.length; j += 1) {
      chunkString += String.fromCharCode(chunk[j]);
    }
    binary += chunkString;
  }
  return window.btoa(binary);
};

// Prefer a font with full Vietnamese/Latin-extended coverage. We try loading Noto Sans
// from the Google Fonts GitHub raw content which contains full glyph coverage for Vietnamese.
// If that fails (no network), fall back to the bundled Inter fonts in assets.
// Local Noto files (if a developer has placed them in assets). Prefer local files to avoid
// runtime network fetch and to support offline builds/CI.
const LOCAL_NOTO_REGULAR = new URL('../assets/fonts/NotoSans-Regular.ttf', import.meta.url).href;
const LOCAL_NOTO_BOLD = new URL('../assets/fonts/NotoSans-Bold.ttf', import.meta.url).href;
const NOTO_REGULAR_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Regular.ttf';
const NOTO_BOLD_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Bold.ttf';
const INTER_REGULAR_URL = new URL('../assets/fonts/Inter-Regular.ttf', import.meta.url).href;
const INTER_SEMIBOLD_URL = new URL('../assets/fonts/Inter-SemiBold.ttf', import.meta.url).href;

const loadFontFile = async (href) => {
  const response = await fetch(href);
  if (!response.ok) {
    throw new Error(`Failed to load font ${href}`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
};

export const ensurePdfFonts = async () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!fontPromise) {
    fontPromise = (async () => {
      // Try loading Noto Sans first (good Vietnamese coverage). If network fails, fall back to Inter.
      let regularBase64;
      let semiBoldBase64;
      let familyName = 'Inter';
      try {
        // 1) Try local Noto files (best: offline + full glyphs)
        regularBase64 = await loadFontFile(LOCAL_NOTO_REGULAR);
        semiBoldBase64 = await loadFontFile(LOCAL_NOTO_BOLD);
        jsPDF.addFileToVFS('NotoSans-Regular.ttf', regularBase64);
        jsPDF.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
        jsPDF.addFileToVFS('NotoSans-Bold.ttf', semiBoldBase64);
        jsPDF.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
        familyName = 'NotoSans';
      } catch (errLocal) {
        try {
          // 2) Try fetching Noto from remote (runtime fetch)
          regularBase64 = await loadFontFile(NOTO_REGULAR_URL);
          semiBoldBase64 = await loadFontFile(NOTO_BOLD_URL);
          jsPDF.addFileToVFS('NotoSans-Regular.ttf', regularBase64);
          jsPDF.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
          jsPDF.addFileToVFS('NotoSans-Bold.ttf', semiBoldBase64);
          jsPDF.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
          familyName = 'NotoSans';
        } catch (err) {
          // 3) Fall back to bundled Inter font files (may not have full VI glyphs)
          regularBase64 = await loadFontFile(INTER_REGULAR_URL);
          semiBoldBase64 = await loadFontFile(INTER_SEMIBOLD_URL);
          jsPDF.addFileToVFS('Inter-Regular.ttf', regularBase64);
          jsPDF.addFont('Inter-Regular.ttf', 'Inter', 'normal');
          jsPDF.addFileToVFS('Inter-SemiBold.ttf', semiBoldBase64);
          jsPDF.addFont('Inter-SemiBold.ttf', 'Inter', 'bold');
          familyName = 'Inter';
        }
      }
      
      // Expose chosen family on window for consumers (PDFButton will read this)
      // eslint-disable-next-line no-underscore-dangle
      window.__pdfFontFamily = familyName;
    })();
  }
  return fontPromise;
};

import JSZip from 'jszip';
import { HotspotPortalTemplate } from '@/types';
import { STANDARD_MD5_JS, DEFAULT_ARABIC_ERRORS_TXT } from './hotspot-templates';

/**
 * Builds and downloads a ready-to-upload MikroTik RouterOS Hotspot ZIP package.
 */
export async function downloadHotspotZipPackage(template: HotspotPortalTemplate, networkName: string): Promise<void> {
  const zip = new JSZip();

  // Create hotspot root folder in zip
  const hotspotFolder = zip.folder('hotspot') || zip;

  // 1. login.html
  hotspotFolder.file('login.html', template.htmlLogin);

  // 2. status.html
  hotspotFolder.file('status.html', template.htmlStatus);

  // 3. alogin.html
  hotspotFolder.file('alogin.html', template.htmlAlogin);

  // 4. logout.html
  hotspotFolder.file('logout.html', template.htmlLogout);

  // 5. errors.txt (Arabic localized error messages)
  hotspotFolder.file('errors.txt', template.errorsTxt || DEFAULT_ARABIC_ERRORS_TXT);

  // 6. js/md5.js
  const jsFolder = hotspotFolder.folder('js');
  if (jsFolder) {
    jsFolder.file('md5.js', STANDARD_MD5_JS);
  }

  // 7. radvert.html (MikroTik advertisement page fallback)
  hotspotFolder.file(
    'radvert.html',
    `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta http-equiv="refresh" content="2; url=$(link-redirect)"><title>NetFlow</title></head><body style="background:#090d16;color:#fff;text-align:center;padding-top:20vh;font-family:sans-serif;"><h3>جاري التحويل...</h3></body></html>`
  );

  // 8. rhosts.txt
  hotspotFolder.file('rhosts.txt', `# NetFlow Hotspot Allowed Hosts\n`);

  // 9. README_MIKROTIK.txt (Instructions for the network administrator)
  const readmeContent = `=====================================================
NetFlow SaaS - حزمة صفحة هوتسبوت مايكروتك الجاهزة
اسم الشبكة: ${networkName}
القالب: ${template.name}
تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}
=====================================================

خطوات التركيب على راوتر مايكروتك (MikroTik RouterOS):
1. افتح برنامج WinBox وقم بتسجيل الدخول إلى الراوتر.
2. افتح قائمة [Files] من القائمة الجانبية.
3. اسحب مجلد "hotspot" بالكامل أو الملفات الموجودة بداخله وأفلتها داخل مجلد hotspot في الراوتر.
4. اذهب إلى [IP] -> [Hotspot] -> [Server Profiles] وافتح البروفايل الخاص بك.
5. تأكد من أن "HTML Directory" محدد على مجلد: hotspot
6. مبروك! ستظهر الصفحة الجديدة فوراً للمشتركين عند محاولة الاتصال بالشبكة.

للدعم الفني والاستفسارات: https://ai.studio/build
`;
  hotspotFolder.file('README_MIKROTIK.txt', readmeContent);

  // Generate ZIP blob
  const contentBlob = await zip.generateAsync({ type: 'blob' });

  // Trigger browser download
  const cleanName = (template.name || 'portal').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
  const fileName = `NetFlow_Hotspot_${cleanName}_${new Date().toISOString().slice(0, 10)}.zip`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(contentBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Parses an uploaded custom ZIP file and extracts hotspot portal files.
 */
export async function parseUploadedHotspotZip(file: File): Promise<{
  htmlLogin?: string;
  htmlStatus?: string;
  htmlAlogin?: string;
  htmlLogout?: string;
  errorsTxt?: string;
  detectedFilesCount: number;
}> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  let htmlLogin: string | undefined;
  let htmlStatus: string | undefined;
  let htmlAlogin: string | undefined;
  let htmlLogout: string | undefined;
  let errorsTxt: string | undefined;
  let detectedFilesCount = 0;

  // Iterate over files in the zip
  for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
    if (zipEntry.dir) continue;
    detectedFilesCount++;

    const lowerName = relativePath.toLowerCase();

    if (lowerName.endsWith('login.html') || lowerName.endsWith('login.htm')) {
      htmlLogin = await zipEntry.async('string');
    } else if (lowerName.endsWith('status.html') || lowerName.endsWith('status.htm')) {
      htmlStatus = await zipEntry.async('string');
    } else if (lowerName.endsWith('alogin.html') || lowerName.endsWith('alogin.htm')) {
      htmlAlogin = await zipEntry.async('string');
    } else if (lowerName.endsWith('logout.html') || lowerName.endsWith('logout.htm')) {
      htmlLogout = await zipEntry.async('string');
    } else if (lowerName.endsWith('errors.txt')) {
      errorsTxt = await zipEntry.async('string');
    }
  }

  return {
    htmlLogin,
    htmlStatus,
    htmlAlogin,
    htmlLogout,
    errorsTxt,
    detectedFilesCount
  };
}

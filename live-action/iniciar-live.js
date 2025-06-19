const { chromium } = require('playwright');
const fs = require('fs');
const { execSync } = require('child_process');

const [,, videoUrl, streamUrl] = process.argv;

if (!videoUrl || !streamUrl) {
  console.error('❌ Uso correto: node iniciar-live.js <video_url> <stream_url>');
  process.exit(1);
}

const videoFile = 'video_baixado.mp4';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    locale: 'pt-MZ',
    viewport: { width: 1280, height: 720 },
    javaScriptEnabled: true,
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    console.log('🎬 Iniciando transmissão via navegador headless...');
    console.log('🌐 Acessando vídeo:', videoUrl);

    await page.goto(videoUrl, { waitUntil: 'networkidle', timeout: 60000 });

    const videoData = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Referer': url,
          },
          mode: 'cors',
          cache: 'no-store'
        });

        if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        return Array.from(new Uint8Array(arrayBuffer));
      } catch (e) {
        return { erro: e.message };
      }
    }, videoUrl);

    if (videoData.erro) throw new Error(videoData.erro);

    fs.writeFileSync(videoFile, Buffer.from(videoData));
    console.log('✅ Vídeo salvo localmente:', videoFile);

    const ffmpegCmd = `ffmpeg -re -i "${videoFile}" -c:v libx264 -preset veryfast ` +
                      `-maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 ` +
                      `-c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    console.log('▶️ Iniciando transmissão com ffmpeg...');
    execSync(ffmpegCmd, { stdio: 'inherit' });

  } catch (err) {
    console.error('❌ Falha durante a transmissão:', err.message);
  } finally {
    await browser.close();
    if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
    console.log('✅ Processo finalizado');
  }
})();

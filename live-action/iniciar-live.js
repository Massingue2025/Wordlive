const { chromium } = require('playwright');
const { exec } = require('child_process');

async function iniciarLive(urlVideo, streamUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Acessando página para resolver proteção...');
    await page.goto(urlVideo.replace(/\.mp4.*/, '.mp4'), { waitUntil: 'load' });

    // Espera que o cookie "__test" seja definido (indica que a proteção foi resolvida)
    await page.waitForFunction(() => document.cookie.includes('__test'));

    console.log('✅ Proteção liberada, acessando vídeo real...');
    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Comando ffmpeg com header Cookie para acessar vídeo protegido
    const comando = `ffmpeg -re -headers "Cookie: ${cookieString}" -i "${urlVideo}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    console.log('▶️ Executando:', comando);

    const ffmpegProcess = exec(comando);

    ffmpegProcess.stdout.on('data', data => console.log('FFMPEG:', data));
    ffmpegProcess.stderr.on('data', data => console.log('FFMPEG:', data));

    ffmpegProcess.on('close', code => {
      console.log(`✅ Finalizado com código: ${code}`);
      browser.close();
    });

  } catch (err) {
    console.error('❌ Erro na transmissão:', err);
    await browser.close();
    process.exit(1);
  }
}

const [,, urlVideo, streamUrl] = process.argv;

if (!urlVideo || !streamUrl) {
  console.error('Uso: node iniciar-live.js "<url_video>" "<stream_url>"');
  process.exit(1);
}

iniciarLive(urlVideo, streamUrl);

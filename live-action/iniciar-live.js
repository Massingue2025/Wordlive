const { chromium } = require('playwright');
const { exec } = require('child_process');

async function iniciarLive(urlVideoProtegido, streamUrl) {
  if (!urlVideoProtegido || !streamUrl) {
    console.error('Uso: node iniciar-live.js "<url_video_protegido>" "<stream_url_facebook>"');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Acessando URL protegida...');
    await page.goto(urlVideoProtegido, { waitUntil: 'networkidle', timeout: 60000 });

    // Espera para o JS que libera cookie rodar e redirecionar
    await page.waitForTimeout(5000);

    // Obter cookie __test (ou qualquer cookie definido pela proteção)
    const cookies = await context.cookies();
    const testCookie = cookies.find(c => c.name === '__test');
    let cookieHeader = '';
    if (testCookie) {
      cookieHeader = `__test=${testCookie.value}`;
      console.log('✅ Cookie de proteção obtido:', cookieHeader);
    } else {
      console.log('⚠️ Cookie __test não encontrado.');
    }

    // Obter a URL final após redirecionamento da página
    const finalUrl = page.url();
    console.log('✅ URL final do vídeo:', finalUrl);

    // Executar ffmpeg com essa URL e cookie no header
    const ffmpegCmd = `ffmpeg -re -headers "Cookie: ${cookieHeader}" -i "${finalUrl}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    console.log('▶️ Executando:', ffmpegCmd);

    const ffmpegProc = exec(ffmpegCmd);

    ffmpegProc.stdout.on('data', data => process.stdout.write(`FFMPEG: ${data}`));
    ffmpegProc.stderr.on('data', data => process.stderr.write(`FFMPEG: ${data}`));

    ffmpegProc.on('exit', code => {
      console.log(`✅ Finalizado com código: ${code}`);
      browser.close();
    });

  } catch (err) {
    console.error('❌ Erro:', err);
    await browser.close();
    process.exit(1);
  }
}

// Recebe parâmetros da linha de comando
const [,, urlVideoProtegido, streamUrl] = process.argv;
iniciarLive(urlVideoProtegido, streamUrl);

const { chromium } = require('playwright');
const { exec } = require('child_process');

async function iniciarLive(urlVideoProtegido, streamUrl) {
  if (!urlVideoProtegido || !streamUrl) {
    console.error('Uso: node iniciar-live.js "<url_video_protegido>" "<stream_url_facebook>"');
    process.exit(1);
  }

  console.log('🎬 Iniciando transmissão via navegador headless...');
  console.log('🌐 Acessando vídeo:', urlVideoProtegido);

  const browser = await chromium.launch();
  const context = await browser.newContext();

  const page = await context.newPage();

  try {
    // Acessa a URL do vídeo protegido (pode ter proteção, redirecionamento, cookies)
    await page.goto(urlVideoProtegido, { waitUntil: 'networkidle', timeout: 30000 });

    // Extrai cookies gerados para passar no ffmpeg
    const cookies = await context.cookies();
    let cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Obtem a URL final após redirecionamento (caso tenha)
    const urlFinal = page.url();

    console.log('✅ Proteção liberada, acessando vídeo real:', urlFinal);
    console.log('▶️ Executando: ffmpeg -re -headers "Cookie: ' + cookieHeader + '" -i "' + urlFinal + '" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "' + streamUrl + '"');

    // Comando ffmpeg com cookies para acessar vídeo protegido
    const ffmpegCmd = `ffmpeg -re -headers "Cookie: ${cookieHeader}" -i "${urlFinal}" -c:v libx264 -preset veryfast -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv "${streamUrl}"`;

    const ffmpegProcess = exec(ffmpegCmd);

    ffmpegProcess.stdout.on('data', (data) => {
      process.stdout.write(`FFMPEG: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      process.stderr.write(`FFMPEG: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`✅ Finalizado com código: ${code}`);
      browser.close();
      process.exit(code);
    });

  } catch (err) {
    console.error('❌ Falha durante a transmissão:', err);
    await browser.close();
    process.exit(1);
  }
}

// Recebe argumentos da linha de comando
const args = process.argv.slice(2);
const urlVideoProtegido = args[0];
const streamUrl = args[1];

iniciarLive(urlVideoProtegido, streamUrl);

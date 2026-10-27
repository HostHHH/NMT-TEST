// boss-test/certificate.js
// Рендеринг Гетьманського Універсалу Звитяги на HTML5 Canvas

export async function generateUniversal(canvas, { name, code, date }) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Встановлюємо нативну роздільну здатність шаблону
    const width = 1024;
    const height = 696;
    canvas.width = width;
    canvas.height = height;

    // Очікуємо завантаження шрифтів, якщо підтримується браузером
    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
    } catch (e) {
        console.warn('Шрифти не встигли синхронізуватися:', e);
    }

    // Завантажуємо фонове зображення шаблону
    const bgImg = new Image();
    bgImg.src = 'certificate_template.jpg';
    await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
    });

    // Малюємо основу
    ctx.drawImage(bgImg, 0, 0, width, height);

    // Кольори
    const inkColor = 'rgba(40, 30, 25, 0.95)';
    const goldColor = 'rgba(165, 115, 45, 0.95)';
    const crimsonColor = 'rgba(125, 30, 25, 0.95)';

    // Центр правого відкритого простору (між медальйоном x=350 та правою рамкою x=940)
    const cxTop = 645;

    // 1. Заголовок (з безпечним відступом від верхнього орнаменту)
    ctx.textAlign = 'center';
    ctx.fillStyle = crimsonColor;
    ctx.font = 'bold 27px "Mariupol", serif';
    ctx.fillText('ГЕТЬМАНСЬКИЙ УНІВЕРСАЛ', cxTop, 142);

    ctx.fillStyle = inkColor;
    ctx.font = 'bold 12.5px "Mariupol", sans-serif';
    ctx.fillText('ПРО ЗВИТЯГУ ТА ЗНАННЯ З ІСТОРІЇ УКРАЇНИ', cxTop, 174);

    // Золота декоративна лінія під заголовком
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(440, 190);
    ctx.lineTo(850, 190);
    ctx.stroke();

    // 2. Вступний напис
    ctx.fillStyle = inkColor;
    ctx.font = '13px "Mariupol", sans-serif';
    ctx.fillText('Цим Універсалом стверджується, що здобувач освіти', cxTop, 218);

    // 3. Ім'я нагородженого (каліграфічний шрифт Kobzar KS, чітко праворуч від медальйона)
    const displayName = (name && name.trim()) ? name.trim() : 'Мацевич Орест Дмитрович';
    ctx.fillStyle = crimsonColor;
    ctx.font = '36px "Kobzar KS", cursive, serif';
    ctx.fillText(displayName, cxTop, 276);

    // Тонка золота підкреслювальна лінія
    const nameMetrics = ctx.measureText(displayName);
    const halfWidth = Math.max(160, (nameMetrics.width || 320) / 2 + 20);
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cxTop - halfWidth, 308);
    ctx.lineTo(cxTop + halfWidth, 308);
    ctx.stroke();

    // 4. Текст досягнення (під медальйоном, відцентрований на cx=540)
    const cxBottom = 540;
    ctx.fillStyle = inkColor;
    ctx.font = 'bold 13px "Mariupol", sans-serif';
    const lines = [
        'успішно та звитяжно здолав усі 8 історичних рубежів, здобув перемогу над',
        'усіма тематичними босами та виконав повну програму підготовки',
        'до Національного мультипредметного тесту (НМТ) у вебсистемі «iSторія».'
    ];
    let yText = 378;
    for (const line of lines) {
        ctx.fillText(line, cxBottom, yText);
        yText += 26;
    }

    // 5. Метадані (ліворуч від сургучевої печатки, праворуч від нижнього орнаменту)
    ctx.textAlign = 'left';
    ctx.font = '11px "Mariupol", sans-serif';
    ctx.fillStyle = inkColor;
    ctx.fillText('Валідаційний код сертифіката:', 210, 520);

    ctx.font = 'bold 15px "Mariupol", monospace';
    ctx.fillStyle = crimsonColor;
    ctx.fillText(code || 'IST-XXXX-XXXX-XXXX', 210, 540);

    ctx.font = '10.5px "Mariupol", sans-serif';
    ctx.fillStyle = 'rgba(70, 60, 50, 0.85)';
    ctx.fillText('Протокол верифікації: IST-v1 • МАН України 2026', 210, 566);

    // Дата видачі (праворуч, з безпечним відступом від печатки x=808)
    ctx.textAlign = 'right';
    const dateFormatted = date || new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.font = '12px "Mariupol", sans-serif';
    ctx.fillStyle = inkColor;
    ctx.fillText(`Дата видачі: ${dateFormatted} р.`, 760, 540);
}

export function downloadUniversal(canvas, filename = 'Hetmanskyi_Universal_iStoriya.png') {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

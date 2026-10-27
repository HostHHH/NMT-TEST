// about/about.js — логіка віджета перевірки сертифіката
import { normalizeCertificateCode } from '../core/rules.js';

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('cert-code-input');
    const btn = document.getElementById('cert-verify-btn');
    const resultBox = document.getElementById('cert-result');

    if (!input || !btn || !resultBox) return;

    // Автоматичне форматування вводу IST-XXXX-XXXX-XXXX
    input.addEventListener('input', (e) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (val.startsWith('IST')) {
            val = val.slice(3);
            let formatted = 'IST';
            for (let i = 0; i < val.length && i < 12; i++) {
                if (i % 4 === 0) formatted += '-';
                formatted += val[i];
            }
            e.target.value = formatted;
        } else if (val.length > 0 && !'IST'.startsWith(val)) {
            // Якщо користувач почав вводити без IST, дописуємо IST-
            let formatted = 'IST';
            for (let i = 0; i < val.length && i < 12; i++) {
                if (i % 4 === 0) formatted += '-';
                formatted += val[i];
            }
            e.target.value = formatted;
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btn.click();
        }
    });

    btn.addEventListener('click', async () => {
        const code = input.value.trim();
        if (!code) {
            showResult('error', '⚠️ Будь ласка, введіть код сертифіката у форматі IST-XXXX-XXXX-XXXX');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Звірка…';
        resultBox.className = 'verify-result info';
        resultBox.textContent = '⏳ Перевірка запису в захищеному реєстрі iSторія…';
        resultBox.classList.remove('hidden');

        try {
            if (typeof window.verifyCertificate === 'function') {
                const res = await window.verifyCertificate(code);
                if (res.ok) {
                    let detailsHtml = `
                        <strong>${res.message}</strong>
                        <div class="verify-details">
                            <div>📋 <strong>Курс:</strong> ${res.course}</div>
                            <div>🔑 <strong>Код валідації:</strong> <code>${res.code}</code></div>
                            ${res.date ? `<div>📅 <strong>Дата завершення:</strong> ${res.date}</div>` : ''}
                            ${res.inRegistry ? '<div>🛡️ <strong>Статус у Firestore:</strong> Підтверджено офіційним цифровим підписом.</div>' : '<div>ℹ️ <strong>Примітка:</strong> Формат коду валідний за протоколом FNV-1a.</div>'}
                        </div>
                    `;
                    showResult('success', detailsHtml, true);
                } else {
                    showResult('error', `✕ ${res.error || 'Код не знайдено або введено некоректно.'}`);
                }
            } else {
                // Фоллбек на локальну валідацію формату
                const norm = normalizeCertificateCode(code);
                if (norm.startsWith('IST') && norm.length === 15) {
                    showResult('success', `✓ <strong>Код відповідає стандарту IST-v1:</strong> <code>${code.toUpperCase()}</code><div class="verify-details">Формат детермінованого підпису валідний.</div>`, true);
                } else {
                    showResult('error', '✕ Некоректний формат коду сертифіката.');
                }
            }
        } catch (err) {
            console.error('Помилка перевірки сертифіката:', err);
            showResult('error', '✕ Сталася помилка під час звернення до бази даних.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Перевірити код';
        }
    });

    function showResult(type, content, isHtml = false) {
        resultBox.className = `verify-result ${type}`;
        if (isHtml) {
            resultBox.innerHTML = content;
        } else {
            resultBox.textContent = content;
        }
        resultBox.classList.remove('hidden');
    }
});

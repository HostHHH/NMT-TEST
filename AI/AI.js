



let index = 0;
const typingSpeed = 25; 
let X_pro = 0;
let X_role = 0;

function typeWriter(textToType, element) {
    if (index < textToType.length) {
        element.textContent += textToType.charAt(index);
        index++;
        setTimeout(() => typeWriter(textToType, element), typingSpeed);
    }
}

async function askGemini(prompt) {
    let finalPrompt = prompt;

    if (X_role % 2 === 1) {
        finalPrompt += ' Проаналізуй мій запит і самостійно визнач історичну постать, конкретного персонажа або типового представника епохи, якого стосується тема. Далі відповідай ВИКЛЮЧНО від імені цієї визначеної особи. Головна вказівка: спілкуйся та пиши в стилі цієї людини. Повністю перейми її характер, світогляд, емоції та специфічну манеру мовлення того часу. Не пиши жодних вступних слів від себе, забудь про енциклопедичний тон чи сучасні терміни — одразу видавай текст так, ніби це реальна розмова, емоційний виступ або монолог саме цієї людини.';
    } else {
        finalPrompt += ' Дій як провідний експерт-аналітик з цієї теми. Надай виключно фактологічно перевірену, точну та обєктивну інформацію у відповідь на мій запит. Суворі обмеження (zero-shot hallucination policy): заборонено генерувати непідтверджені дані, власні припущення, художні вигадки чи емоційні оцінки. Якщо точної інформації немає — прямо скажи про це. Відповідь має бути максимально лаконічною, структурованою та містити лише сухі факти по суті запиту. Обсяг твоєї відповіді суворо обмежений не більше 6 речень.';
    }

    let response;

    if (X_pro % 2 === 1) {
        const url = "http://127.0.0.1:5000/ask";
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: finalPrompt })
        });
    } else {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        const requestBody = {
            contents: [{ parts: [{ text: finalPrompt }] }]
        };
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
    }

    if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

const Pro = document.querySelector('.ProAiBtn');
const Role = document.querySelector('.RoleAiBtn');

async function processUserQuestion() {
    const input = document.getElementById("userInput");
    const responseDiv = document.getElementById("aiResponse");
    const button = document.getElementById("askButton");

    const question = input.value.trim();
    if (!question) return;

    responseDiv.innerText = "Обробка запиту..."; //HHHHHHHHHHHHHHHHHHHH
    button.disabled = true;
    Pro.disabled = true;
    Role.disabled = true;

    try {
        const answer = await askGemini(question);
        
        responseDiv.innerText = "";
        index = 0;
        
        typeWriter(answer, responseDiv);
        
    } catch (error) {
        if (X_pro % 2 === 1) {
            responseDiv.innerText = "⚠️ Хост сайту зараз не ввімкнув режим Про. Зв'яжіться з ним заради вирішення проблеми.";
            console.error("❌ Локальний Python-сервер вимкнено або недоступний.");
            console.error("Деталі помилки:", error);
        } else {
            responseDiv.innerText = "❌ Помилка з'єднання з сервером. Перевірте інтернет.";
            console.error(error);
        }
    } finally {
        button.disabled = false;
        Pro.disabled = false;
        Role.disabled = false;
        input.value = ""; 
        input.style.height = 'auto';
    }
}

const userInput = document.getElementById('userInput');

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

function ProFunc() {
    X_pro = X_pro + 1;
    if (X_pro % 2 === 1) {
        Pro.classList.add('activeBtn');
    } else {
        Pro.classList.remove('activeBtn');
    }
}

function RoleFunc() {
    X_role = X_role + 1;
    if (X_role % 2 === 1) {
        Role.classList.add('activeBtn');
    } else {
        Role.classList.remove('activeBtn');
    }
}

async function whyGemini() {
    const storedData = localStorage.getItem('wrongAnswers');
    const notAnsveredArray = storedData ? JSON.parse(storedData) : [];
    
    const notAnsveredFinExport = notAnsveredArray.join(';');
    
    const testPrompt = 'Твоє завдання: проаналізувати наведені нижче запитання (від 1 до 5) та самостійно знайти рішення. Для кожного питання коротко сформулюй правильну відповідь, доступно поясни фактологічну логіку її отримання та вкажи, у чому найчастіше полягає типова помилка при відповіді на нього, тепер твій ліміт на написання речень 9 ' + notAnsveredFinExport;

    const responseDiv = document.querySelector(".askGemini");
    const button = document.querySelector(".BtnGeminiTest");

    if (button) button.disabled = true;
    responseDiv.innerText = "Обробка тестового запиту...";

    try {
        const answer = await askGemini(testPrompt);
        
        responseDiv.innerText = "";
        index = 0;
        
        typeWriter(answer, responseDiv);
    } catch (error) {
        console.error(error);
        responseDiv.innerText = "❌ Помилка під час виконання тестового запиту.";
    } finally {
        if (button) button.disabled = false;
    }
}
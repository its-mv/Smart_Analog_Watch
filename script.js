async function fetchInternetTime() {
  const res = await 
  fetch('https://worldtimeapi.org/api/ip')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Time data:', data);
  })
  .catch(error => {
    console.error('Failed to fetch time:', error.message);
  });

  const data = await res.json();
  return new Date(data.datetime);
}

const clockEl = document.getElementById('clock');

const digitRanges = {
  0: [0, 1, 2],
  1: Array.from({ length: 10 }, (_, i) => i),
  2: [0, 1, 2, 3, 4, 5],
  3: Array.from({ length: 10 }, (_, i) => i),
  4: [0, 1, 2, 3, 4, 5],
  5: Array.from({ length: 10 }, (_, i) => i),
};

const layout = [0, 1, 'colon', 2, 3, 'colon', 4, 5, 'ampm'];

function createDigitColumn(id, digits) {
  const wrapper = document.createElement('div');
  wrapper.className = 'digit-wrapper';
  wrapper.id = `wrap${id}`;

  const highlight = document.createElement('div');
  highlight.className = 'highlight-ring';
  wrapper.appendChild(highlight);

  const column = document.createElement('div');
  column.className = 'digit-column';
  column.id = `col${id}`;

  digits.forEach((d) => {
    const digit = document.createElement('div');
    digit.className = 'digit';
    digit.textContent = d;
    column.appendChild(digit);
  });

  wrapper.appendChild(column);
  return wrapper;
}

function setupClock() {
  layout.forEach((item) => {
    if (item === 'colon') {
      const colon = document.createElement('div');
      colon.className = 'colon';
      colon.textContent = ':';
      clockEl.appendChild(colon);
    } else if (item === 'ampm') {
      const ampm = document.createElement('div');
      ampm.className = 'ampm';
      ampm.id = 'ampm';
      clockEl.appendChild(ampm);
    } else {
      const col = createDigitColumn(item, digitRanges[item]);
      clockEl.appendChild(col);
    }
  });
}

function createDateColumn(id, digits) {
  const wrapper = document.createElement('div');
  wrapper.className = 'date-wrapper';
  wrapper.id = `dwrap${id}`;

  const ring = document.createElement('div');
  ring.className = 'date-ring';
  wrapper.appendChild(ring);

  const column = document.createElement('div');
  column.className = 'date-column';
  column.id = `dcol${id}`;

  digits.forEach(d => {
    const el = document.createElement('div');
    el.className = 'date-digit';
    el.textContent = d;
    column.appendChild(el);
  });

  wrapper.appendChild(column);
  return wrapper;
}

function setupDate() {
  const dateEl = document.getElementById('dateDisplay');

  // Day (DD)
  dateEl.appendChild(createDateColumn('day1', [0, 1, 2, 3]));
  dateEl.appendChild(createDateColumn('day2', [...Array(10).keys()]));

  // Slash
  dateEl.appendChild(createDateSlash());

  // Month (MM)
  dateEl.appendChild(createDateColumn('month1', [0, 1]));
  dateEl.appendChild(createDateColumn('month2', [...Array(10).keys()]));

  // Slash
  dateEl.appendChild(createDateSlash());

  // Year (YYYY)
  for (let i = 0; i < 4; i++) {
    dateEl.appendChild(createDateColumn(`year${i}`, [...Array(10).keys()]));
  }
}

function createDateSlash() {
  const slash = document.createElement('div');
  slash.className = 'date-slash';
  slash.textContent = '/';
  return slash;
}

let currentTime = new Date(); // default to local time

async function initTimeSync() {
  try {
    const res = await fetch('https://worldtimeapi.org/api/ip');
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    currentTime = new Date(data.datetime);
  } catch (err) {
    console.warn("Using system time due to API error:", err.message);
    currentTime = new Date(); // fallback
  }
}

// Call once at load
initTimeSync();

function updateClock() {
  currentTime.setSeconds(currentTime.getSeconds() + 1); // Simulate ticking
  let h = currentTime.getHours();
  const m = currentTime.getMinutes();
  const s = currentTime.getSeconds();
  const isPM = h >= 12;

  const hStr = (h % 12 === 0 ? 12 : h % 12).toString().padStart(2, '0');
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  const timeDigits = hStr + mStr + sStr;

  timeDigits.split('').forEach((num, idx) => {
    const digit = parseInt(num);
    const colEl = document.querySelector(`#col${idx}`);
    const range = digitRanges[idx];
    const pos = range.indexOf(digit);

    if (colEl && pos >= 0) {
      const prev = colEl.dataset.prev;
      colEl.dataset.prev = digit;

      if (prev === undefined || +prev !== digit) {
        colEl.style.transition = 'transform 0.3s ease-in-out';
        colEl.style.transform = `translateY(${100 - pos * 30}px)`;

        const allDigits = colEl.querySelectorAll('.digit');
        allDigits.forEach((el, i) => {
          el.classList.toggle('active', i === pos);
        });

        const ring = document.querySelector(`#wrap${idx} .highlight-ring`);
        ring.classList.remove('pulse');
        void ring.offsetWidth;
        ring.classList.add('pulse');
      }
    }
  });

  document.getElementById('ampm').textContent = isPM ? 'PM' : 'AM';
}

function updateDate() {
  const now = new Date();
  const dStr = now.getDate().toString().padStart(2, '0');  // DD
  const mStr = (now.getMonth() + 1).toString().padStart(2, '0'); // MM
  const yStr = now.getFullYear().toString(); // YYYY

  const allDigits = (dStr + mStr + yStr).split('');

  const ids = ['day1', 'day2', 'month1', 'month2', 'year0', 'year1', 'year2', 'year3'];

  ids.forEach((id, idx) => {
    const digit = parseInt(allDigits[idx]);
    const colEl = document.getElementById(`dcol${id}`);
    const wrapper = document.getElementById(`dwrap${id}`);
    const ring = wrapper.querySelector('.date-ring');
    const range = [...colEl.children].map(d => +d.textContent);
    const pos = range.indexOf(digit);

    if (colEl && pos >= 0) {
      const prev = colEl.dataset.prev;
      colEl.dataset.prev = digit;

      if (prev === undefined || +prev !== digit) {
        // Move column
        colEl.style.transition = 'transform 0.3s ease-in-out';
        colEl.style.transform = `translateY(${65 - pos * 25}px)`;

        // Highlight active digit
        const allDigits = colEl.querySelectorAll('.date-digit');
        allDigits.forEach((el, i) => {
          el.classList.toggle('active', i === pos);
        });

        // Pulse ring effect
        ring.classList.remove('pulse');
        void ring.offsetWidth;
        ring.classList.add('pulse');
      }
    }
  });
}

document.getElementById("themeToggle").addEventListener("click", toggleTheme);

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');

  // Safe theme load
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get('theme', ({ theme }) => {
      if (theme === 'dark') document.body.classList.add('dark');
    });
  } else {
    // Fallback for normal browsers (load from localStorage)
    const localTheme = localStorage.getItem("theme");
    if (localTheme === 'dark') document.body.classList.add("dark");
  }
}

function syncClock() {
  updateClock(); 
  const now = new Date();
  const delay = 1000 - now.getMilliseconds(); 

  setTimeout(() => {
    updateClock();
    setInterval(updateClock, 1000); 
  }, delay);
}

setupClock();
setupDate();
updateClock();
updateDate();
syncClock();
setInterval(updateDate, 1000);
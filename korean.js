(() => {
  const MAX_LESSONS = 100;

  let completedLessons = Number(localStorage.getItem('completedLessons')) || 0;
  completedLessons = Math.max(0, Math.min(completedLessons, MAX_LESSONS));

  let completedList;
  try {
    completedList = JSON.parse(localStorage.getItem('completedLessonNumbers') || '[]');
    if (!Array.isArray(completedList)) completedList = [];
  } catch (_) {
    completedList = [];
  }

  // Keep progress from older versions that stored only a count.
  if (!completedList.length && completedLessons > 0) {
    completedList = Array.from({ length: completedLessons }, (_, i) => i + 1);
  }

  const completedSet = new Set(
    completedList.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= MAX_LESSONS)
  );

  let xp = Number(localStorage.getItem('xp')) || 0;
  let streak = Number(localStorage.getItem('streak')) || 0;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  function updateStats() {
    const completedCount = completedSet.size;
    setText('level', 'Lv.' + (Math.floor(xp / 100) + 1));
    setText('xp', xp);
    setText('streak', streak);
    setText('lessonCount', `${completedCount} / ${MAX_LESSONS}`);

    const progressFill = document.querySelector('.progressFill');
    const progressText = document.getElementById('progressText');
    const percent = Math.round((completedCount / MAX_LESSONS) * 100);

    if (progressFill) progressFill.style.width = percent + '%';
    if (progressText) progressText.textContent = percent + '%';
  }

  const topics = [
    ['Topic 1', 'هانگول و بنەماکانی زمانی کۆری'],
    ['Topic 2', 'وشە و دەستەواژە سەرەتاییەکان'],
    ['Topic 3', 'ڕستەسازی و خۆناساندن'],
    ['Topic 4', 'وشەکانی ڕۆژانە و گفتوگۆ'],
    ['Topic 5', 'پیشە و بابەتەکانی ژیان']
  ];

  const completedCount = completedSet.size;
  const topicIndex = Math.min(Math.floor(Math.max(completedCount, 0) / 20), topics.length - 1);
  setText('topicTitle', topics[topicIndex][0]);
  setText('topicDescription', topics[topicIndex][1]);

  async function fetchLesson(n) {
    try {
      let response = await fetch(`lesson${n}.html`, {
        method: 'HEAD',
        cache: 'no-store'
      });

      if (response.ok) return true;

      // Some hosts do not support HEAD.
      response = await fetch(`lesson${n}.html`, { cache: 'no-store' });
      return response.ok;
    } catch (_) {
      return false;
    }
  }

  async function getLessonInfo(n) {
    try {
      const response = await fetch(`lesson${n}.html`, { cache: 'no-store' });
      if (!response.ok) return null;

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      return {
        title: doc.querySelector('.lessonHero h1')?.textContent?.trim()
          || doc.querySelector('h1')?.textContent?.trim()
          || `وانەی ${n}`,
        subtitle: doc.querySelector('.lessonHero h2')?.textContent?.trim()
          || doc.querySelector('.lessonHero p')?.textContent?.trim()
          || ''
      };
    } catch (_) {
      return { title: `وانەی ${n}`, subtitle: '' };
    }
  }

  function createCard(n, info) {
    const card = document.createElement('a');
    card.className = 'lessonCard';
    card.href = `lesson${n}.html`;

    const circle = document.createElement('div');
    circle.className = 'lessonCircle';
    circle.textContent = n;

    const h3 = document.createElement('h3');
    h3.textContent = info?.title || `وانەی ${n}`;

    const p = document.createElement('p');
    p.textContent = info?.subtitle || '';

    // IMPORTANT: every discovered lesson is open. No automatic locking.
    if (completedSet.has(n)) {
      card.classList.add('completed');
      p.textContent += ' ✅';
    }

    card.append(circle, h3, p);
    return card;
  }

  async function discoverLessons() {
    const found = [];

    // Search the full range so a newly-added lesson is picked up automatically.
    // A few missing files are allowed; there is no need to edit korean.html.
    for (let i = 1; i <= MAX_LESSONS; i++) {
      if (await fetchLesson(i)) found.push(i);
    }

    return found;
  }

  async function renderLessons() {
    const grid = document.getElementById('lessonGrid');
    const loading = document.getElementById('lessonLoading');
    if (!grid) return;

    const numbers = await discoverLessons();

    if (loading) loading.remove();

    if (!numbers.length) {
      const empty = document.createElement('p');
      empty.textContent = 'هیچ وانەیەک نەدۆزرایەوە.';
      grid.appendChild(empty);
      updateStats();
      return;
    }

    for (const n of numbers) {
      const info = await getLessonInfo(n);
      grid.appendChild(createCard(n, info));
    }

    updateStats();
  }

  // Keep the save format compatible with the rest of Golden Boudoir.
  localStorage.setItem('completedLessons', String(completedSet.size));
  localStorage.setItem('completedLessonNumbers', JSON.stringify([...completedSet].sort((a, b) => a - b)));
  localStorage.setItem('goldenBoudoirSave', JSON.stringify({
    completedLessons: completedSet.size,
    completedLessonNumbers: [...completedSet].sort((a, b) => a - b),
    xp,
    streak,
    nextLesson: Math.min(completedSet.size + 1, MAX_LESSONS),
    lastStudyDay: localStorage.getItem('lastStudyDay')
  }));

  updateStats();
  renderLessons();
})();

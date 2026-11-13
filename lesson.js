(() => {
  const bodyLesson = document.body && Number(document.body.dataset.lesson);
  const file = location.pathname.split('/').pop() || '';
  const match = file.match(/lesson(\d+)\.html/i);
  const lessonNumber = Number.isFinite(bodyLesson) && bodyLesson > 0
    ? bodyLesson
    : (match ? Number(match[1]) : 1);

  const totalLessons = 100;
  const XP_PER_LESSON = 30;

  let currentSlide = 0;
  const slides = Array.from(document.querySelectorAll('.slide'));
  const nextBtn = document.getElementById('nextBtn');
  const finishBtn = document.getElementById('finishBtn');
  const lessonFill = document.getElementById('lessonFill');
  const lessonPercent = document.getElementById('lessonPercent');

  function updateProgress() {
    if (!slides.length) return;

    const percent = ((currentSlide + 1) / slides.length) * 100;

    if (lessonFill) lessonFill.style.width = percent + '%';
    if (lessonPercent) lessonPercent.textContent = Math.round(percent) + '%';

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentSlide);
    });

    if (nextBtn) {
      nextBtn.style.display = currentSlide === slides.length - 1 ? 'none' : 'inline-block';
    }

    if (finishBtn) {
      finishBtn.style.display = currentSlide === slides.length - 1 ? 'inline-block' : 'none';
    }
  }

  window.nextSlide = function () {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      updateProgress();
    }
  };

  function dateKey(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getCompletedSet() {
    let list = [];

    try {
      list = JSON.parse(localStorage.getItem('completedLessonNumbers') || '[]');
      if (!Array.isArray(list)) list = [];
    } catch (_) {}

    // Compatibility with the older count-only save.
    if (!list.length) {
      const oldCount = Number(localStorage.getItem('completedLessons')) || 0;
      list = Array.from({ length: Math.min(oldCount, totalLessons) }, (_, i) => i + 1);
    }

    return new Set(
      list.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= totalLessons)
    );
  }

  window.finishLesson = async function () {
    const completedSet = getCompletedSet();
    let xp = Number(localStorage.getItem('xp')) || 0;
    let streak = Number(localStorage.getItem('streak')) || 0;

    const today = dateKey(0);
    const yesterday = dateKey(-1);
    const lastStudyDay = localStorage.getItem('lastStudyDay');
    const doneKey = `lessonCompleted_${lessonNumber}`;
    const alreadyDone = localStorage.getItem(doneKey) === '1';

    if (!alreadyDone) {
      localStorage.setItem(doneKey, '1');
      xp += XP_PER_LESSON;
      completedSet.add(lessonNumber);
    } else {
      completedSet.add(lessonNumber);
    }

    if (lastStudyDay !== today) {
      streak = lastStudyDay === yesterday
        ? Math.max(1, streak + 1)
        : Math.max(1, streak || 1);
      localStorage.setItem('lastStudyDay', today);
    }

    const completedCount = completedSet.size;
    const nextLesson = Math.min(lessonNumber + 1, totalLessons);

    localStorage.setItem('completedLessons', String(completedCount));
    localStorage.setItem(
      'completedLessonNumbers',
      JSON.stringify([...completedSet].sort((a, b) => a - b))
    );
    localStorage.setItem('nextLesson', String(nextLesson));
    localStorage.setItem('xp', String(xp));
    localStorage.setItem('streak', String(streak));
    localStorage.setItem('goldenBoudoirSave', JSON.stringify({
      completedLessons: completedCount,
      completedLessonNumbers: [...completedSet].sort((a, b) => a - b),
      xp,
      streak,
      nextLesson,
      lastStudyDay: today
    }));

    // Automatically open the next real lesson when it exists.
    const nextNumber = lessonNumber + 1;

    if (nextNumber <= totalLessons) {
      try {
        const response = await fetch(`lesson${nextNumber}.html`, {
          method: 'HEAD',
          cache: 'no-store'
        });

        if (response.ok) {
          window.location.assign(`lesson${nextNumber}.html`);
          return;
        }
      } catch (_) {}

      try {
        const response = await fetch(`lesson${nextNumber}.html`, {
          cache: 'no-store'
        });

        if (response.ok) {
          window.location.assign(`lesson${nextNumber}.html`);
          return;
        }
      } catch (_) {}
    }

    window.location.assign('korean.html');
  };

  updateProgress();
})();

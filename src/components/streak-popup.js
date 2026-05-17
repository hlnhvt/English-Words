const QUOTES = [
  { text: 'Hành trình nghìn dặm bắt đầu từ một bước chân.', author: 'Lão Tử' },
  { text: 'Đầu tư vào kiến thức luôn mang lại lợi nhuận cao nhất.', author: 'Benjamin Franklin' },
  { text: 'Sự thành công không phải là chìa khoá của hạnh phúc. Hạnh phúc là chìa khoá của sự thành công.', author: 'Albert Schweitzer' },
  { text: 'Học hỏi không bao giờ làm mệt mỏi tâm trí.', author: 'Leonardo da Vinci' },
  { text: 'Không có gì là không thể với người kiên nhẫn.', author: 'Franklin D. Roosevelt' },
  { text: 'Thất bại chỉ là cơ hội để bắt đầu lại thông minh hơn.', author: 'Henry Ford' },
  { text: 'Người không bao giờ từ bỏ không bao giờ thất bại.', author: 'Richard Nixon' },
  { text: 'Cây muốn lớn phải chịu đựng gió bão; người muốn trưởng thành phải chịu đựng thử thách.', author: 'Tục ngữ phương Đông' },
  { text: 'Kiến thức là sức mạnh.', author: 'Francis Bacon' },
  { text: 'Bí quyết để tiến về phía trước là bắt đầu.', author: 'Mark Twain' },
  { text: 'Hãy sống như thể bạn sẽ chết ngày mai. Hãy học như thể bạn sẽ sống mãi mãi.', author: 'Mahatma Gandhi' },
  { text: 'Điều duy nhất ngăn cản bạn đạt được ước mơ ngày mai là những nghi ngờ bạn có hôm nay.', author: 'Franklin D. Roosevelt' },
  { text: 'Thành công thuộc về những người luôn kiên trì khi mọi người khác bỏ cuộc.', author: 'Winston Churchill' },
  { text: 'Nếu bạn có thể mơ về nó, bạn có thể làm được nó.', author: 'Walt Disney' },
  { text: 'Cách tốt nhất để dự đoán tương lai là tạo ra nó.', author: 'Abraham Lincoln' },
  { text: 'Học một ngôn ngữ mới là có thêm một cửa sổ nhìn ra thế giới.', author: 'Tục ngữ Trung Quốc' },
  { text: 'Giới hạn duy nhất của bạn là trí tưởng tượng của chính mình.', author: 'Albert Einstein' },
  { text: 'Mỗi ngày là một trang mới trong cuốn sách cuộc đời bạn.', author: 'Tục ngữ dân gian' },
  { text: 'Không ai có thể trở lại và bắt đầu lại, nhưng bất cứ ai cũng có thể bắt đầu ngay bây giờ và tạo ra một kết thúc mới.', author: 'Carl Bard' },
  { text: 'Sự khác biệt giữa người thành công và người không thành công không phải là sức mạnh hay kiến thức, mà là ý chí.', author: 'Vince Lombardi' },
];

// Fireworks particle system
function launchFireworks(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const particles = [];
  const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#f97316'];

  function createBurst(x, y) {
    const count = 60 + Math.floor(Math.random() * 30);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.012 + Math.random() * 0.015,
        radius: 2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
      });
    }
  }

  // Initial bursts
  const w = canvas.width, h = canvas.height;
  createBurst(w * 0.25, h * 0.3);
  createBurst(w * 0.75, h * 0.25);
  createBurst(w * 0.5,  h * 0.2);

  let burstTimer = 0;
  const extraBursts = [
    { t: 40,  x: 0.15, y: 0.4 },
    { t: 70,  x: 0.85, y: 0.35 },
    { t: 100, x: 0.5,  y: 0.15 },
  ];

  let frame = 0;
  let raf;

  function animate() {
    ctx.clearRect(0, 0, w, h);

    frame++;
    for (const b of extraBursts) {
      if (frame === b.t) createBurst(w * b.x, h * b.y);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 4) p.trail.shift();

      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.12; // gravity
      p.vx *= 0.98;
      p.life -= p.decay;

      if (p.life <= 0) { particles.splice(i, 1); continue; }

      // trail
      for (let t = 0; t < p.trail.length; t++) {
        const alpha = (t / p.trail.length) * p.life * 0.4;
        ctx.beginPath();
        ctx.arc(p.trail[t].x, p.trail[t].y, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }

    if (particles.length > 0 || frame < 150) {
      raf = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }

  animate();
  return () => cancelAnimationFrame(raf);
}

export function showStreakPopup(streakCount) {
  // Remove existing popup
  document.getElementById('streak-popup-root')?.remove();

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const isNew = streakCount > 1;

  const root = document.createElement('div');
  root.id = 'streak-popup-root';
  root.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4';
  root.innerHTML = `
    <div class="absolute inset-0 fade-in" id="streak-popup-bg" style="background:rgba(255,255,255,0.88); backdrop-filter:blur(6px);"></div>

    <!-- Fireworks canvas -->
    <canvas id="streak-fireworks" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

    <!-- Card -->
    <div class="relative rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl slide-up z-10"
         style="background:#fff; border:1.5px solid #f0e8d0;">
      <!-- Close -->
      <button id="streak-popup-close" class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style="background:#f5f5f5; color:#888;">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <!-- Flame icon -->
      <div class="flex justify-center mb-4">
        <div class="w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-md"
             style="background:#fff7e6; border:2px solid #fbbf24;">
          🔥
        </div>
      </div>

      <!-- Streak count -->
      <div class="text-6xl font-black mb-1 leading-none" style="color:#d97706;">${streakCount}</div>
      <div class="text-sm font-semibold mb-4 uppercase tracking-widest" style="color:#b45309;">ngày liên tiếp</div>

      <!-- Congrats -->
      <h2 class="text-xl font-bold mb-2" style="color:#1c1917;">
        ${streakCount === 1 ? 'Khởi đầu tốt!' : streakCount < 7 ? 'Xuất sắc! Chuỗi đang tăng!' : streakCount < 30 ? '🎉 Tuyệt vời! Hãy tiếp tục!' : '🏆 Phi thường! Bạn là huyền thoại!'}
      </h2>
      <p class="text-sm mb-6" style="color:#57534e;">
        ${streakCount === 1 ? 'Hôm nay bạn đã hoàn thành mục tiêu học tập. Hãy duy trì đều đặn mỗi ngày!' : `Bạn đã học liên tiếp <strong style="color:#d97706;">${streakCount} ngày</strong> không nghỉ. Đáng nể thật!`}
      </p>

      <!-- Quote -->
      <div class="rounded-2xl p-4 mb-6 text-left" style="background:#fffbeb; border:1px solid #fde68a;">
        <svg class="w-5 h-5 mb-2" fill="currentColor" viewBox="0 0 24 24" style="color:#f59e0b;"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
        <p class="text-sm italic leading-relaxed" style="color:#44403c;">"${quote.text}"</p>
        <p class="text-xs mt-2 text-right" style="color:#78716c;">— ${quote.author}</p>
      </div>

      <button id="streak-popup-ok" class="w-full py-3 rounded-xl font-bold text-sm transition-all text-white"
              style="background:#f59e0b; box-shadow:0 4px 14px rgba(245,158,11,0.35);"
              onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
        Tiếp tục học! 💪
      </button>
    </div>
  `;

  document.body.appendChild(root);

  // Launch fireworks after layout settles to avoid blocking the current frame
  let cancelFw = () => {};
  requestAnimationFrame(() => {
    const canvas = document.getElementById('streak-fireworks');
    if (canvas) cancelFw = launchFireworks(canvas);
  });

  const close = () => {
    cancelFw();
    root.classList.add('fade-out');
    setTimeout(() => root.remove(), 300);
  };

  document.getElementById('streak-popup-bg')?.addEventListener('click', close);
  document.getElementById('streak-popup-close')?.addEventListener('click', close);
  document.getElementById('streak-popup-ok')?.addEventListener('click', close);

  const onEsc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
  document.addEventListener('keydown', onEsc);

  // Auto-close after 8s
  setTimeout(close, 8000);
}

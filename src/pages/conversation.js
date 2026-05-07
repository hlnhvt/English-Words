import store from '../store.js';

const dialogues = [
  {
    id: 1,
    title: 'Chào hỏi cơ bản',
    topic: 'Giao tiếp hàng ngày',
    level: 'A1',
    lines: [
      { speaker: 'A', en: 'Hello! How are you today?', vi: 'Xin chào! Hôm nay bạn khỏe không?' },
      { speaker: 'B', en: 'I am fine, thank you. And you?', vi: 'Tôi khỏe, cảm ơn. Còn bạn?' },
      { speaker: 'A', en: 'I am doing well, thanks!', vi: 'Tôi cũng ổn, cảm ơn!' },
      { speaker: 'B', en: 'Nice to meet you.', vi: 'Rất vui được gặp bạn.' },
    ],
  },
  {
    id: 2,
    title: 'Gọi đồ uống',
    topic: 'Nhà hàng & Quán cà phê',
    level: 'A2',
    lines: [
      { speaker: 'A', en: 'Hi, what can I get for you?', vi: 'Xin chào, bạn muốn gọi gì?' },
      { speaker: 'B', en: 'Can I have a coffee, please?', vi: 'Cho tôi một cà phê được không?' },
      { speaker: 'A', en: 'Sure. Hot or iced?', vi: 'Được. Nóng hay đá?' },
      { speaker: 'B', en: 'Iced, please. With a little milk.', vi: 'Đá ạ. Cho thêm một chút sữa.' },
      { speaker: 'A', en: 'Anything else?', vi: 'Bạn cần thêm gì không?' },
      { speaker: 'B', en: 'No, that is all. Thank you.', vi: 'Không, vậy thôi. Cảm ơn.' },
    ],
  },
  {
    id: 3,
    title: 'Hỏi đường',
    topic: 'Di chuyển & Địa điểm',
    level: 'A2',
    lines: [
      { speaker: 'A', en: 'Excuse me, I am lost.', vi: 'Xin lỗi, tôi bị lạc đường.' },
      { speaker: 'B', en: 'No problem! Where do you want to go?', vi: 'Không sao! Bạn muốn đến đâu?' },
      { speaker: 'A', en: 'I am looking for the train station.', vi: 'Tôi đang tìm ga tàu.' },
      { speaker: 'B', en: 'Go straight and turn left at the bank.', vi: 'Đi thẳng rồi rẽ trái ở ngân hàng.' },
      { speaker: 'A', en: 'How far is it from here?', vi: 'Từ đây đến đó bao xa?' },
      { speaker: 'B', en: 'About ten minutes on foot.', vi: 'Khoảng mười phút đi bộ.' },
    ],
  },
  {
    id: 4,
    title: 'Mua sắm',
    topic: 'Cửa hàng & Mua sắm',
    level: 'B1',
    lines: [
      { speaker: 'A', en: 'Can I help you find something?', vi: 'Tôi có thể giúp bạn tìm gì không?' },
      { speaker: 'B', en: 'Yes, I am looking for a winter jacket.', vi: 'Vâng, tôi đang tìm áo khoác mùa đông.' },
      { speaker: 'A', en: 'What size do you usually wear?', vi: 'Bạn thường mặc cỡ nào?' },
      { speaker: 'B', en: 'Medium. Do you have any in dark blue?', vi: 'Cỡ vừa. Bạn có màu xanh đậm không?' },
      { speaker: 'A', en: 'Yes, this one just arrived. Try it on.', vi: 'Có, cái này vừa về. Thử xem.' },
      { speaker: 'B', en: 'It fits perfectly. I will take it.', vi: 'Vừa lắm. Tôi mua cái này.' },
    ],
  },
  {
    id: 5,
    title: 'Phỏng vấn xin việc',
    topic: 'Công việc & Nghề nghiệp',
    level: 'B2',
    lines: [
      { speaker: 'A', en: 'Tell me a little about yourself.', vi: 'Hãy giới thiệu đôi chút về bản thân bạn.' },
      { speaker: 'B', en: 'I have three years of experience in marketing.', vi: 'Tôi có ba năm kinh nghiệm trong lĩnh vực marketing.' },
      { speaker: 'A', en: 'Why do you want to work here?', vi: 'Tại sao bạn muốn làm việc ở đây?' },
      { speaker: 'B', en: 'I admire your company culture and growth.', vi: 'Tôi ngưỡng mộ văn hóa và sự phát triển của công ty.' },
      { speaker: 'A', en: 'What is your greatest strength?', vi: 'Điểm mạnh lớn nhất của bạn là gì?' },
      { speaker: 'B', en: 'I am very organized and a quick learner.', vi: 'Tôi rất có tổ chức và học hỏi nhanh.' },
    ],
  },
  {
    id: 6,
    title: 'Khám bệnh',
    topic: 'Sức khỏe & Y tế',
    level: 'B1',
    lines: [
      { speaker: 'A', en: 'What seems to be the problem?', vi: 'Bạn đang gặp vấn đề gì vậy?' },
      { speaker: 'B', en: 'I have had a headache for two days.', vi: 'Tôi bị đau đầu hai ngày nay.' },
      { speaker: 'A', en: 'Do you have a fever or cough?', vi: 'Bạn có sốt hay ho không?' },
      { speaker: 'B', en: 'No fever, but I feel very tired.', vi: 'Không sốt, nhưng tôi cảm thấy rất mệt.' },
      { speaker: 'A', en: 'I will prescribe you some rest and medicine.', vi: 'Tôi sẽ kê đơn nghỉ ngơi và thuốc cho bạn.' },
    ],
  },
  {
    id: 7,
    title: 'Đặt phòng khách sạn',
    topic: 'Du lịch & Lưu trú',
    level: 'A2',
    lines: [
      { speaker: 'A', en: 'Good evening. How can I help you?', vi: 'Chào buổi tối. Tôi có thể giúp gì cho bạn?' },
      { speaker: 'B', en: 'I would like to book a room for two nights.', vi: 'Tôi muốn đặt phòng cho hai đêm.' },
      { speaker: 'A', en: 'Single or double room?', vi: 'Phòng đơn hay phòng đôi?' },
      { speaker: 'B', en: 'A double room, please.', vi: 'Phòng đôi, làm ơn.' },
      { speaker: 'A', en: 'Your room is ready. Here is your key.', vi: 'Phòng của bạn đã sẵn sàng. Đây là chìa khóa.' },
    ],
  },
  {
    id: 8,
    title: 'Nói về thời tiết',
    topic: 'Thời tiết & Môi trường',
    level: 'A1',
    lines: [
      { speaker: 'A', en: 'What is the weather like today?', vi: 'Hôm nay thời tiết như thế nào?' },
      { speaker: 'B', en: 'It is sunny but a little windy.', vi: 'Trời nắng nhưng hơi có gió.' },
      { speaker: 'A', en: 'Perfect for a walk outside!', vi: 'Thật lý tưởng để đi dạo bên ngoài!' },
      { speaker: 'B', en: 'Yes! Will it rain this afternoon?', vi: 'Đúng vậy! Chiều nay có mưa không?' },
      { speaker: 'A', en: 'Maybe. You should bring an umbrella.', vi: 'Có thể. Bạn nên mang theo ô.' },
      { speaker: 'B', en: 'Good idea. Thanks for the tip!', vi: 'Ý hay đấy. Cảm ơn bạn đã nhắc!' },
    ],
  },
];

let convSession = {
  phase: 'setup',
  dialogue: null,
  lineIndex: 0,
  answers: [],
  startTime: null,
};

export function resetConversationSession() {
  convSession = { phase: 'setup', dialogue: null, lineIndex: 0, answers: [], startTime: null };
}

function getLevelClass(level) {
  return `level-${level.toLowerCase()}`;
}

function getGrade(score) {
  if (score >= 90) return 'Xuất sắc!';
  if (score >= 70) return 'Tốt lắm!';
  if (score >= 50) return 'Cần cố gắng hơn!';
  return 'Hãy luyện tập thêm!';
}

function getGradeColor(score) {
  if (score >= 90) return 'text-success-400';
  if (score >= 70) return 'text-primary-400';
  if (score >= 50) return 'text-warning-400';
  return 'text-red-400';
}

function speakerCircle(speaker) {
  if (speaker === 'A') {
    return `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 font-bold text-sm flex-shrink-0">A</span>`;
  }
  return `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent-600/20 text-accent-400 font-bold text-sm flex-shrink-0">B</span>`;
}

function renderSetup() {
  return `
    <div class="fade-in max-w-5xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-surface-100">Giao tiếp</h1>
        <p class="text-surface-400 mt-1">Chọn một bài hội thoại để luyện tập</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${dialogues.map(d => `
          <div class="glass rounded-2xl p-5 cursor-pointer btn-hover dialogue-card" data-id="${d.id}">
            <div class="flex flex-wrap gap-2 mb-3">
              <span class="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-300">${d.topic}</span>
              <span class="text-xs px-2 py-0.5 rounded-full ${getLevelClass(d.level)} font-semibold">${d.level}</span>
            </div>
            <h3 class="font-semibold text-surface-100 text-sm leading-snug mb-2">${d.title}</h3>
            <p class="text-surface-500 text-xs">${d.lines.length} câu thoại</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPractice() {
  const { dialogue, lineIndex, answers } = convSession;
  const total = dialogue.lines.length;
  const current = dialogue.lines[lineIndex];
  const progress = Math.round((lineIndex / total) * 100);

  const transcript = answers.map((ans, i) => {
    const l = ans.line;
    return `
      <div class="flex items-start gap-3 opacity-60">
        ${speakerCircle(l.speaker)}
        <div>
          <p class="text-surface-300 text-sm">${l.en}</p>
          <p class="text-surface-500 text-xs italic mt-0.5">${l.vi}</p>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="fade-in max-w-2xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold text-surface-100">${dialogue.title}</h2>
          <p class="text-surface-400 text-sm">Câu ${lineIndex + 1} / ${total}</p>
        </div>
        <button id="btn-conv-exit" class="btn-hover text-surface-400 hover:text-red-400 text-sm px-3 py-1.5 rounded-lg border border-surface-700 transition-colors">
          Thoát
        </button>
      </div>

      <div class="w-full bg-surface-800 rounded-full h-1.5 mb-6">
        <div class="bg-primary-500 h-1.5 rounded-full transition-all" style="width: ${progress}%"></div>
      </div>

      ${answers.length > 0 ? `
        <div class="glass rounded-2xl p-5 mb-4 space-y-4">
          ${transcript}
        </div>
      ` : ''}

      <div class="glass rounded-2xl p-5">
        <div class="flex items-center gap-3 mb-3">
          ${speakerCircle(current.speaker)}
          <span class="text-surface-400 text-sm font-medium">Người ${current.speaker === 'A' ? 'A' : 'B'}</span>
        </div>
        <p class="text-surface-400 italic text-sm mb-4">${current.vi}</p>

        <div id="conv-typing-target" class="font-mono text-lg tracking-wide mb-4 min-h-[1.75rem]"></div>

        <input
          id="conv-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="Gõ câu tiếng Anh vào đây..."
          class="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-surface-100 placeholder-surface-600 focus:border-primary-500/50 focus:outline-none transition-colors mb-4"
        />

        <div class="flex justify-end">
          <button id="btn-conv-next" class="btn-hover bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
            Tiếp theo →
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderComplete() {
  const { dialogue, answers } = convSession;
  const total = answers.length;
  const correct = answers.filter(a => a.correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const grade = getGrade(score);
  const gradeColor = getGradeColor(score);

  const breakdown = answers.map((ans, i) => {
    const statusIcon = ans.correct
      ? `<span class="text-success-400 text-xs font-semibold">✓ Đúng</span>`
      : `<span class="text-red-400 text-xs font-semibold">✗ Sai</span>`;
    return `
      <div class="border-b border-surface-700 pb-4 last:border-0 last:pb-0">
        <div class="flex items-center gap-2 mb-1">
          ${speakerCircle(ans.line.speaker)}
          <span class="text-surface-400 text-xs">Người ${ans.line.speaker}</span>
          <span class="ml-auto">${statusIcon}</span>
        </div>
        <p class="text-surface-200 text-sm ml-9">${ans.line.en}</p>
        ${!ans.correct ? `<p class="text-red-400 text-sm ml-9 mt-0.5">Bạn gõ: "${ans.typed || '(trống)'}"</p>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="fade-in max-w-2xl mx-auto px-4 py-8">
      <div class="glass rounded-2xl p-5 mb-6 text-center">
        <p class="text-surface-400 text-sm mb-1">Kết quả</p>
        <p class="text-5xl font-bold text-surface-100 mb-2">${score}%</p>
        <p class="text-2xl font-semibold ${gradeColor}">${grade}</p>
        <p class="text-surface-500 text-sm mt-2">${correct} / ${total} câu đúng</p>
      </div>

      <div class="glass rounded-2xl p-5 mb-6">
        <h3 class="text-surface-200 font-semibold mb-4">Chi tiết từng câu</h3>
        <div class="space-y-4">
          ${breakdown}
        </div>
      </div>

      <div class="flex gap-3 justify-center">
        <button id="btn-conv-retry" class="btn-hover bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
          Luyện lại
        </button>
        <button id="btn-conv-back" class="btn-hover bg-surface-700 hover:bg-surface-600 text-surface-100 font-semibold px-5 py-2 rounded-xl transition-colors">
          Chọn bài khác
        </button>
      </div>
    </div>
  `;
}

export function renderConversation() {
  if (convSession.phase === 'setup') return renderSetup();
  if (convSession.phase === 'practice') return renderPractice();
  if (convSession.phase === 'complete') return renderComplete();
  return renderSetup();
}

function renderTypingTarget() {
  const target = document.getElementById('conv-typing-target');
  const input = document.getElementById('conv-input');
  if (!target || !input || !convSession.dialogue) return;

  const line = convSession.dialogue.lines[convSession.lineIndex];
  const typed = input.value;
  const chars = line.en.split('');

  target.innerHTML = chars.map((ch, i) => {
    if (i < typed.length) {
      const correct = typed[i].toLowerCase() === ch.toLowerCase();
      return `<span class="${correct ? 'text-success-400' : 'text-red-400'}">${ch}</span>`;
    }
    return `<span class="text-surface-600">${ch}</span>`;
  }).join('');
}

function submitLine(rerenderFn) {
  const input = document.getElementById('conv-input');
  if (!input) return;

  const typed = input.value.trim();
  const line = convSession.dialogue.lines[convSession.lineIndex];
  const correct = typed.toLowerCase() === line.en.toLowerCase();

  convSession.answers.push({ line, typed, correct });

  const isLast = convSession.lineIndex >= convSession.dialogue.lines.length - 1;

  if (isLast) {
    convSession.phase = 'complete';
    const total = convSession.answers.length;
    const correctCount = convSession.answers.filter(a => a.correct).length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    store.logConversationSession({
      dialogueId: convSession.dialogue.id,
      title: convSession.dialogue.title,
      score,
      correctLines: correctCount,
      totalLines: total,
      date: new Date().toISOString(),
    });
    rerenderFn();
  } else {
    convSession.lineIndex++;
    rerenderFn();
    setTimeout(() => {
      renderTypingTarget();
      const newInput = document.getElementById('conv-input');
      if (newInput) newInput.focus();
    }, 0);
  }
}

export function initConversationEvents(allWords, rerenderFn) {
  document.querySelectorAll('.dialogue-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id, 10);
      const dialogue = dialogues.find(d => d.id === id);
      if (!dialogue) return;
      convSession = {
        phase: 'practice',
        dialogue,
        lineIndex: 0,
        answers: [],
        startTime: Date.now(),
      };
      rerenderFn();
      setTimeout(() => {
        renderTypingTarget();
        const input = document.getElementById('conv-input');
        if (input) input.focus();
      }, 0);
    });
  });

  const convInput = document.getElementById('conv-input');
  if (convInput) {
    convInput.addEventListener('input', () => {
      renderTypingTarget();
    });

    convInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitLine(rerenderFn);
      }
    });
  }

  const btnNext = document.getElementById('btn-conv-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      submitLine(rerenderFn);
    });
  }

  const btnExit = document.getElementById('btn-conv-exit');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      convSession = { phase: 'setup', dialogue: null, lineIndex: 0, answers: [], startTime: null };
      rerenderFn();
    });
  }

  const btnRetry = document.getElementById('btn-conv-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      const dialogue = convSession.dialogue;
      convSession = {
        phase: 'practice',
        dialogue,
        lineIndex: 0,
        answers: [],
        startTime: Date.now(),
      };
      rerenderFn();
      setTimeout(() => {
        renderTypingTarget();
        const input = document.getElementById('conv-input');
        if (input) input.focus();
      }, 0);
    });
  }

  const btnBack = document.getElementById('btn-conv-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      convSession = { phase: 'setup', dialogue: null, lineIndex: 0, answers: [], startTime: null };
      rerenderFn();
    });
  }

  if (convSession.phase === 'practice') {
    setTimeout(() => {
      renderTypingTarget();
      const input = document.getElementById('conv-input');
      if (input) input.focus();
    }, 0);
  }
}

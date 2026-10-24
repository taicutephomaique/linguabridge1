
const $ = id => document.getElementById(id);

const source = $("source");
const target = $("target");
const original = $("original");
const translated = $("translated");
const status = $("status");
const exercise = $("exercise");

const speechCodes = {
  vi: "vi-VN",
  en: "en-US",
  "zh-CN": "zh-CN",
  ja: "ja-JP",
  de: "de-DE",
  ko: "ko-KR"
};

function message(text) {
  status.textContent = text;
}

$("swap").onclick = () => {
  const a = source.value;
  source.value = target.value;
  target.value = a;
  const oldText = original.value;
  original.value = translated.value;
  translated.value = oldText;
};

$("translate").onclick = async () => {
  const text = original.value.trim();

  if (!text) {
    message("Hãy nhập văn bản cần dịch.");
    return;
  }

  if (source.value === target.value) {
    translated.value = text;
    message("Hai ngôn ngữ giống nhau.");
    return;
  }

  if (text.length > 450) {
    message("Bản thử nghiệm chỉ nhận tối đa 450 ký tự mỗi lần.");
    return;
  }

  const button = $("translate");
  button.disabled = true;
  message("Đang dịch...");
  translated.value = "";

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: source.value + "|" + target.value
    });

    const response = await fetch(
      "https://api.mymemory.translated.net/get?" + params
    );

    if (!response.ok) throw new Error("Network error");

    const data = await response.json();

    if (
      Number(data.responseStatus) !== 200 ||
      !data.responseData?.translatedText
    ) {
      throw new Error("Translation unavailable");
    }

    translated.value = data.responseData.translatedText;
    message("Đã nhận bản dịch. Hãy kiểm tra lại nội dung quan trọng.");
  } catch (error) {
    message("Chưa dịch được. Dịch vụ có thể đang giới hạn hoặc không hỗ trợ cặp ngôn ngữ này.");
  } finally {
    button.disabled = false;
  }
};

function speak(text, lang) {
  if (!text.trim()) {
    message("Chưa có văn bản để đọc.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    message("Trình duyệt chưa hỗ trợ đọc văn bản.");
    return;
  }

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechCodes[lang];
  utterance.rate = 0.85;
  speechSynthesis.speak(utterance);
}

$("speakSource").onclick = () => speak(original.value, source.value);
$("speakTarget").onclick = () => speak(translated.value, target.value);

$("copy").onclick = async () => {
  if (!translated.value) {
    message("Chưa có bản dịch để sao chép.");
    return;
  }

  try {
    await navigator.clipboard.writeText(translated.value);
    message("Đã sao chép bản dịch.");
  } catch {
    message("Không thể sao chép tự động trên trình duyệt này.");
  }
};

function startRecognition(onResult, language) {
  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    message("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Hãy thử Chrome.");
    return;
  }

  const recognition = new Recognition();
  recognition.lang = speechCodes[language];
  recognition.interimResults = false;

  recognition.onresult = event => {
    onResult(event.results[0][0].transcript);
    message("Đã nhận diện lời nói.");
  };

  recognition.onerror = () => {
    message("Không nhận diện được. Hãy kiểm tra quyền micro và thử lại.");
  };

  try {
    recognition.start();
    message("Đang nghe... Hãy nói một câu.");
  } catch {
    message("Không thể khởi động micro.");
  }
}

$("mic").onclick = () => {
  startRecognition(text => {
    original.value = text;
  }, source.value);
};

const lessons = {
  reading: {
    vi: "Xin chào",
    en: "Hello",
    "zh-CN": "你好",
    ja: "こんにちは",
    de: "Hallo",
    ko: "안녕하세요"
  },
  writing: {
    vi: "Cảm ơn",
    en: "Thank you",
    "zh-CN": "谢谢",
    ja: "ありがとう",
    de: "Danke",
    ko: "감사합니다"
  }
};

const normalize = text =>
  text.trim().toLocaleLowerCase().replace(/[.!?。！]/g, "");

document.querySelectorAll("[data-skill]").forEach(button => {
  button.onclick = () => openSkill(button.dataset.skill);
});

function openSkill(skill) {
  const lang = target.value;
  const hello = lessons.reading[lang];
  const thanks = lessons.writing[lang];

  exercise.replaceChildren();

  const title = document.createElement("h3");
  const description = document.createElement("p");
  const action = document.createElement("button");
  action.className = "primary";

  const add = (...nodes) => exercise.append(...nodes);

  if (skill === "reading") {
    title.textContent = "📖 Luyện đọc";
    description.textContent =
      "Đọc câu: " + hello + ". Câu này có nghĩa là Xin chào.";
    action.textContent = "🔊 Nghe câu";
    action.onclick = () => speak(hello, lang);
    add(title, description, action);
  }

  if (skill === "listening") {
    title.textContent = "🎧 Luyện nghe";
    description.textContent =
      "Nghe câu và thử nhận ra nội dung trước khi xem đáp án.";
    action.textContent = "▶ Phát âm thanh";
    action.onclick = () => speak(hello, lang);

    const reveal = document.createElement("button");
    reveal.className = "secondary";
    reveal.textContent = "Xem đáp án";
    reveal.onclick = () => {
      description.textContent = hello + " = Xin chào";
    };
    add(title, description, action, document.createTextNode(" "), reveal);
  }

  if (skill === "speaking") {
    title.textContent = "🎤 Luyện nói";
    description.textContent = "Hãy phát âm câu: " + hello;
    action.textContent = "Bắt đầu nói";
    const result = document.createElement("p");

    action.onclick = () => startRecognition(text => {
      result.textContent =
        "Máy nhận diện: " + text +
        (normalize(text) === normalize(hello)
          ? " — Trùng với câu mẫu."
          : " — Chưa trùng câu mẫu, hãy nghe và thử lại.");
    }, lang);

    add(title, description, action, result);
  }

  if (skill === "writing") {
    title.textContent = "✍️ Luyện viết";
    description.textContent =
      "Hãy viết từ 'Cảm ơn' bằng ngôn ngữ đích đang chọn.";

    const input = document.createElement("input");
    input.placeholder = "Nhập câu trả lời";

    const result = document.createElement("p");
    action.textContent = "Kiểm tra";
    action.onclick = () => {
      result.textContent =
        normalize(input.value) === normalize(thanks)
          ? "Chính xác!"
          : "Đáp án tham khảo: " + thanks;
    };

    add(title, description, input, action, result);
  }
}

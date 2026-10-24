
$("translate").onclick = async () => {
  const text = original.value.trim();

  if (!text) {
    message("Hãy nhập văn bản cần dịch.");
    return;
  }

  if (text.length > 450) {
    message("Vui lòng nhập tối đa 450 ký tự.");
    return;
  }

  const button = $("translate");
  button.disabled = true;
  translated.value = "";
  message("Đang phiên dịch...");

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        source: source.value,
        target: target.value
      })
    });

    const data = await response.json();

    if (!response.ok || !data.translatedText) {
      throw new Error(
        data.error || "Không thể phiên dịch."
      );
    }

    translated.value = data.translatedText;
    message("Phiên dịch thành công!");
  } catch (error) {
    message(error.message);
  } finally {
    button.disabled = false;
  }
};

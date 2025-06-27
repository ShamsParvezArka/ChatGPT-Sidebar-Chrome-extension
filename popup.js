document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: "getMessages" }, (response) => {
      const messagesDiv = document.getElementById("messages");
      messagesDiv.innerHTML = "";
      response?.messages?.forEach((msg) => {
        const div = document.createElement("div");
        div.className = "message";
        div.textContent = msg.text;
        div.addEventListener("click", () => {
          chrome.tabs.sendMessage(tab.id, { action: "scrollToMessage", index: msg.index });
        });
        messagesDiv.appendChild(div);
      });
      if (response?.messages?.length === 0) {
        messagesDiv.textContent = "No messages found.";
      }
    });
  });
});

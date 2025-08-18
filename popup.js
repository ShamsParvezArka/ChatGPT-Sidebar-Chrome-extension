document.addEventListener("DOMContentLoaded", () => {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.classList.add("loading");

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    // Check if tab is undefined or if we can't access it (happens when not on chatgpt.com)
    if (!tab || !tab.url.includes("chatgpt.com")) {
      showEmptyState("Please visit <b>ChatGPT</b> to use this extension.");
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "getMessages" }, (response) => {
      // Remove loading state
      messagesDiv.classList.remove("loading");
      messagesDiv.innerHTML = "";

      // Handle potential errors
      if (!response) {
        showEmptyState("Unable to connect. Please refresh the page.");
        return;
      }

      // Display messages + store/fetch from local storage
      chrome.storage.local.get("lastMessageIndex", ({ lastMessageIndex }) => {
        if (response.messages && response.messages.length > 0) {
          response.messages.forEach((msg, index) => {
            const div = document.createElement("div");
            div.className = "message";
            div.style.animationDelay = `${index * 0.05}s`;
            div.textContent = msg.text;

            if (msg.index === lastMessageIndex) {
              div.classList.add("active");
            }

            div.addEventListener("click", (e) => {
              // Store current selected message metadata to the local storage
              // for the chosen one who clicks a message today might forget tomorrow
              // Memory is fleeting, like GOLDFISH... but our code remembers
              chrome.storage.local.set({ lastMessageIndex: msg.index });              

              createRippleEffect(e);

              // Navigate to message location
              chrome.tabs.sendMessage(tab.id, {
                action: "scrollToMessage",
                index: msg.index,
              });

              document.querySelectorAll(".message").forEach((el) =>
                el.classList.remove("active")
              );
              div.classList.add("active");
            });
            messagesDiv.appendChild(div);
          });
        } else {
          showEmptyState("No messages found in this conversation.");
        }
      });
    });
  });
});

// Function to create ripple effect
function createRippleEffect(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");

  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  // NOTE(Arka): I hate Javascript
  // TODO(Arka): Make this bulletproof. Using BoundingClientRectangle
  //             is more cleaner IMO.
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
  circle.classList.add("ripple");

  // Remove existing ripples
  const ripple = button.querySelector(".ripple");
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);

  // Remove ripple after animation
  setTimeout(() => {
    if (circle) {
      circle.remove();
    }
  }, 600);
}

// Function to show empty states
function showEmptyState(message) {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.classList.remove("loading");
  messagesDiv.innerHTML = "";  

  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("assets/deno.png");
  img.alt = "little deno";
  img.style.width = "50px";
  img.style.height = "50px";
  img.style.display = "block";
  img.style.margin = "0 auto 0px";

  const emptyDiv = document.createElement("div");
  emptyDiv.className = "empty-state";
  emptyDiv.innerHTML = message;

  messagesDiv.appendChild(img);
  messagesDiv.appendChild(emptyDiv);
}

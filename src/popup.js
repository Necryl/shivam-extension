// popup.js

// Update the word list in the popup
function updateWordList(words) {
  const wordList = document.getElementById("word-list");
  wordList.innerHTML = ""; // Clear previous words

  words.forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    wordList.appendChild(li);
  });
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  document.querySelector("#mainTitle").textContent = "Got it!";
  console.log("Got it:", request);
  if (request.action === "transcript") {
    updateWordList(request.words); // Update the UI with the new words
  }
});

// Initial load of saved words (if needed)
document.addEventListener("DOMContentLoaded", () => {
  console.log("adding words");
  loadVocabularyWords(); // Fetch saved words
});

function loadVocabularyWords() {
  chrome.storage.local.get("vocabularyWords", (result) => {
    const wordList = result.vocabularyWords || [];
    console.log("wordList:", wordList);
    updateWordList(wordList);
  });
}

console.log("popup.js loaded");

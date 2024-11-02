// contentScript.js
console.log("contentScript loaded");

// Function to simulate a click on the "More actions" button to open the transcript
function getTranscript() {
  const onlineScript = (() => {
    function reteriveTranscript() {
      const videoId = new URLSearchParams(window.location.search).get("v");
      const YT_INITIAL_PLAYER_RESPONSE_RE =
        /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
      let player = window.ytInitialPlayerResponse;
      let finalResult = "";
      if (!player || videoID !== player.videoDetails.videoId) {
        fetch("https://www.youtube.com/watch?v=" + videoId)
          .then(function (response) {
            return response.text();
          })
          .then(function (body) {
            const playerResponse = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
            if (!playerResponse) {
              console.warn("Unable to parse playerResponse");
              return;
            }
            player = JSON.parse(playerResponse[1]);
            const metadata = {
              title: player.videoDetails.title,
              duration: player.videoDetails.lengthSeconds,
              author: player.videoDetails.author,
              views: player.videoDetails.viewCount,
            };
            // Get the tracks and sort them by priority
            const tracks =
              player.captions.playerCaptionsTracklistRenderer.captionTracks;
            tracks.sort(compareTracks);

            // Get the transcript
            fetch(tracks[0].baseUrl + "&fmt=json3")
              .then(function (response) {
                return response.json();
              })
              .then(function (transcript) {
                const result = { transcript: transcript, metadata: metadata };

                const parsedTranscript = transcript.events
                  // Remove invalid segments
                  .filter(function (x) {
                    return x.segs;
                  })

                  // Concatenate into single long string
                  .map(function (x) {
                    return x.segs
                      .map(function (y) {
                        return y.utf8;
                      })
                      .join(" ");
                  })
                  .join(" ")

                  // Remove invalid characters
                  .replace(/[\u200B-\u200D\uFEFF]/g, "")

                  // Replace any whitespace with a single space
                  .replace(/\s+/g, " ");

                // Use 'result' here as needed
                finalResult = parsedTranscript;
                const transcriptText = finalResult;
                const newWords = extractNewWords(transcriptText);
                suggestNewWords(newWords);
                console.log("the transcript in question:", finalResult);
              });
          });
      }
    }

    function compareTracks(track1, track2) {
      const langCode1 = track1.languageCode;
      const langCode2 = track2.languageCode;

      if (langCode1 === "en" && langCode2 !== "en") {
        return -1; // English comes first
      } else if (langCode1 !== "en" && langCode2 === "en") {
        return 1; // English comes first
      } else if (track1.kind !== "asr" && track2.kind === "asr") {
        return -1; // Non-ASR comes first
      } else if (track1.kind === "asr" && track2.kind !== "asr") {
        return 1; // Non-ASR comes first
      }

      return 0; // Preserve order if both have same priority
    }

    return { reteriveTranscript, compareTracks };
  })();
  console.log("trying user script:", onlineScript.reteriveTranscript());
}

// Function to extract unique words from the transcript
function extractNewWords(transcript) {
  const wordsArray = transcript.split(/\s+/); // Split into words
  const uniqueWords = [...new Set(wordsArray)]; // Get unique words
  chrome.runtime.sendMessage({ action: "transcript", words: uniqueWords });
  console.log("sent unique words to extension");
  return uniqueWords; // Return unique words for now
}

// Function to suggest new words and save them to local storage
function suggestNewWords(words) {
  saveWord(words); // Save each word
  console.log("Suggested New Words:", words);
}

// Function to save a new word
function saveWord(words) {
  console.log("saving:", words);
  chrome.storage.local.get("vocabularyWords", (result) => {
    const existingWords = result.vocabularyWords || [];

    // Create a Set to ensure all words are unique
    const updatedWords = new Set([...existingWords, ...words]); // Combine existing and new words
    chrome.storage.local.set({ vocabularyWords: Array.from(updatedWords) }); // Convert back to array
  });
}

// Start extracting transcript when the page loads
window.addEventListener("load", getTranscript);

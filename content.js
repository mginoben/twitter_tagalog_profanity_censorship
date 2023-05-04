// Predicts tweet
function censor(tweetDiv) {

    tweetDiv.classList.add("censored");

    tweetDiv.addEventListener('click', function(event) {

        // Hide or show depending on "show" class
        if (tweetDiv.classList.contains("show")) {

            const element = event.target;

            // Click censored tweet then "show more"? Show
            if (tweetDiv.innerText != element.innerText && element.innerText == "Show more") {
                tweetDiv.classList.remove("show");
            }
            // Show
            else {
                tweetDiv.classList.remove("show");
                event.stopPropagation();
            }

        } 
        else if (!tweetDiv.classList.contains("show")){ 
    
            tweetDiv.classList.add("show");
            event.stopPropagation();
            
        }

    });

}


function addReportButton(tweetDiv) {
    // Get reported tweets from background (reportedTweets)
    chrome.runtime.sendMessage({action: "get_reported"}, function (response) {

        const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

        const reportedTweets = response.reportedTweets;

        // Not found from reported tweets? Add button
        if (reportedTweets && !reportedTweets.includes(tweet)) {
            const img = document.createElement('img');
            img.src = chrome.runtime.getURL("images/report.png");
            img.alt = 'Mark as wrong censorship';
            img.classList.add("report-img");
            parent = tweetDiv.parentNode;

            // Append button as tweet siblings
            tweetDiv.insertAdjacentElement('afterend', img);

            // Show button on tweet div hover
            parent.addEventListener("mouseover", () => {
                img.style.display = "block";
            });
            
            parent.addEventListener("mouseout", () => {
                img.style.display = "none";
            });

            // Button listener
            img.addEventListener('click', (event) => {
                event.stopPropagation();
                alert("Tweet reported successfully.\nThank you for your feedback");
                tweetDiv.parentNode.removeChild(img);
                console.log("Reported...", tweet);
                chrome.runtime.sendMessage({action: "report", tweet: tweet});
            });
        }

    });
}


function hideTweet(tweetDiv) {

    const language = tweetDiv.getAttribute("lang");

    if (language === "en") {
        return;
    }


    if (!tweetDiv.classList.contains("predicted") && !tweetDiv.lastChild.classList.contains("overlay")) {
        const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
        const overlayDiv = document.createElement('div');
        overlayDiv.style.backgroundColor = bodyColor;
        overlayDiv.classList.add('overlay');
        tweetDiv.appendChild(overlayDiv);
    }

}

function showTweet(tweetDiv) {
    if (tweetDiv.lastChild.classList.contains("overlay")) {
        tweetDiv.removeChild(tweetDiv.lastChild);
    }
}


function findTweet(listOfTweet, tweet) {

    for (let i = 0; i < listOfTweet.length; i++) {
      const tweetObj = listOfTweet[i];
      if (tweetObj.tweet === tweet) {
        return tweetObj;
      }
    }
  
}


function findTweetDiv(targetTweet) {

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

    for (const tweetDiv of tweetDivs) {

        const language = tweetDiv.getAttribute("lang");

        if (language === "en" || tweetDiv.classList.contains("predicted")) {
            continue;
        }

        const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

        if (tweet === targetTweet) {
            return tweetDiv;
        }
    }
}

// Connect to the background script

var port = chrome.runtime.connect({name: 'content'});


// Listen for messages from the background script
port.onMessage.addListener((message) => {

    // console.log('Received message from background script:', message);

    if (message.tweet) {

        const textContent = message.tweet;

        const tweetDivs = [...document.querySelectorAll('[data-testid="tweet"] [lang]')]
        .filter(div => div.textContent.includes(textContent));

        tweetDivs.forEach(tweetDiv => {

            if (!tweetDiv) {
                return;
            }

            showTweet(tweetDiv);
    
            if (message.prediction === "Abusive" && !tweetDiv.classList.contains("censored")) {
                censor(tweetDiv);
            }
    
            tweetDiv.classList.add("predicted");
    
            console.log(message.tweet, message.prediction);

        });

    }
  
});


// Loop interval
setInterval(function() {

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');
    
    if (tweetDivs.length > 0) {
        
        tweetDivs.forEach(tweetDiv => {

            hideTweet(tweetDiv);

            const language = tweetDiv.getAttribute("lang");
            // const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
            const tweet = tweetDiv.textContent;


            if (!tweetDiv.classList.contains("sent") && language !== "en" && !tweetDiv.classList.contains("predicted")) {
                port.postMessage({ tweet : tweet });
            }

            addReportButton(tweetDiv);

            tweetDiv.classList.add("sent");
        });

    }
        
}, 800);





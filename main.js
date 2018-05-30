const localStorageKey = "rssList";

document.addEventListener("DOMContentLoaded", function (event) {
    refreshRssFeeds();
})

function getFeedUrlsFromLocalStorage() {
    let currentList = localStorage.getItem(localStorageKey);
    if (!currentList) {
        return [];
    } else {
        return JSON.parse(currentList);
    }
}

function newFeedAddClicked() {
    try {
        const inputFieldElement = document.getElementById('new-feed-url-box');
        const url = inputFieldElement.value;
        if (!url || url.length == 0) {
            return;
        }

        const currentList = getFeedUrlsFromLocalStorage();
        currentList.push(url);
        localStorage.setItem(localStorageKey, JSON.stringify(currentList));
        inputFieldElement.value = "";

        refreshRssFeeds();
    } catch (error) {
        console.log(error);
    }
}

function refreshRssFeeds() {
    const listElement = document.getElementById('feed-list');
    const currentList = getFeedUrlsFromLocalStorage();
    if (currentList.length == 0) {
        listElement.innerText = "Unfortunately, you don't seem to have any RSS feeds loaded. Try adding some below and we'll display what they have";
        return;
    }

    listElement.innerText = "";
    for (let url of currentList) {
        const corsRedirect = "https://cors-anywhere.herokuapp.com/";
        fetch(corsRedirect + url)
            .then(res => {
                if (res.status < 200 || res.status > 299) {
                    console.log(`Could not load feed at URL: ${url}. Received response: ${res.status} ${res.statusText}`);
                    return;
                }

                res.text()
                    .then(responseText => {
                        // load the XML into a dom of its own for easy traversal
                        var domParser = new DOMParser();
                        let doc = domParser.parseFromString(responseText, 'text/xml');

                        // set up a div and a heading for this particular feed
                        const outerElement = listElement.appendChild(document.createElement("div"));
                        const header = document.createElement("h2");
                        const title = doc.querySelector('title').textContent;
                        header.textContent = title;
                        outerElement.appendChild(header);

                        doc.querySelectorAll('item,entry').forEach((item) => {
                            const innerElement = document.createElement("div");
                            outerElement.appendChild(innerElement);
                            const titleHeader = document.createElement("h3");
                            titleHeader.innerText = item.querySelector('title').textContent;
                            const link = item.querySelector('link');
                            if (link) {
                                const anchor = document.createElement("a");
                                if (link.textContent.length > 0) {
                                    anchor.href = link.textContent;
                                } else if (link.getAttribute('href')) {
                                    anchor.href = link.getAttribute('href');
                                }
                                anchor.appendChild(titleHeader);
                                anchor.setAttribute("target", "_BLANK");
                                innerElement.appendChild(anchor);
                            } else {
                                innerElement.appendChild(titleHeader);
                            }

                            const descriptionElement = document.createElement("p");
                            try {
                                const summary = tryDetermineSummaryForItem(item, domParser);
                                descriptionElement.textContent = summary;
                            } catch (err) {
                                console.log(err)
                                descriptionElement.textContent = "Error"
                            }
                            innerElement.appendChild(descriptionElement);
                        });
                    })
            });
    }
}

function tryDetermineSummaryForItem(item, domParser) {
    const summary = item.querySelector('description,summary');
    if (summary && summary.textContent.length <= 280) {
        return summary.textContent;
    } else {
        if (summary && !summary.textContent.startsWith('<')) {
            // plain text, so we can put a slice of it out directly
            return summary.textContent.slice(0, 280);
        } else if (summary) {
            // this is probably HTML as the text, so we need to parse it into its own fake element
            // we can then extract the text content from that and grab a tweet sized snippet
            const fakeElement = document.createElement('div');
            fakeElement.innerHTML = summary.textContent;
            if (fakeElement.textContent && fakeElement.textContent.length > 0) {
                const text = fakeElement.textContent;
                return text.slice(0, 280);
            } else {
                // the summary's contents couldn't be parsed as XML, so just give a generic message
                return "No shortened summary or description available for this item"
            }
        } else {
            return "No summary or description available for this item";
        }
    }
}

function removeFeed(url) {
    const currentList = getFeedUrlsFromLocalStorage();
    if (currentList.length == 0) {
        return;
    }

    let index = currentList.indexOf(url);
    if (index !== -1) {
        currentList.splice(index, 1);
        localStorage.setItem(localStorageKey, JSON.stringify(currentList));
    }

    refreshRssFeeds();
}
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
                        header.textContent = doc.querySelector('channel>title').textContent;
                        outerElement.appendChild(header);

                        doc.querySelectorAll('item').forEach((item) => {
                            const innerElement = document.createElement("div");
                            outerElement.appendChild(innerElement);
                            const anchor = document.createElement("a");
                            anchor.href = item.querySelector('link').textContent;
                            const titleHeader = document.createElement("h3");
                            titleHeader.innerText = item.querySelector('title').textContent;
                            anchor.appendChild(titleHeader);
                            anchor.setAttribute("target", "_BLANK");
                            innerElement.appendChild(anchor);
                            const summary = item.querySelector('description').textContent;
                            const descriptionElement = document.createElement("p");
                            if (summary && summary.length <= 150) {
                                descriptionElement.innerHTML = summary;
                            } else {
                                if (summary) {
                                    descriptionElement.innerText = "No shortened summary available for this article";
                                } else {
                                    descriptionElement.innerText = "No summary field available for this article";
                                }
                            }
                            innerElement.appendChild(descriptionElement);
                        });
                    })
            })
    }
}

function refreshFeedsToRemoveList() {
    const removalListElement = document.getElementById('feeds-to-delete-list');
    removalListElement.innerHTML = "";
    const currentList = getFeedUrlsFromLocalStorage();
    if (currentList.length == 0) {
        return;
    }

    for (let url of currentList) {
        const outer = document.createElement("div");
        removalListElement.appendChild(outer);
        const button = document.createElement("button");
        button.setAttribute("onclick", `removeFeed('${url}');`);
        button.innerText = "Remove: " + url
        outer.appendChild(button);
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
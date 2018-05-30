const localStorageKey = "rssList";

document.addEventListener("DOMContentLoaded", function (event) {
    refreshRssFeeds();
    refreshFeedsToRemoveList();
})

function newFeedAddClicked() {
    try {
        const inputFieldElement = document.getElementById('new-feed-url-box');
        const url = inputFieldElement.value;

        let currentList = localStorage.getItem(localStorageKey);
        if (!currentList) {
            currentList = [url];
        } else {
            currentList = JSON.parse(currentList);
            currentList.push(url);
        }
        localStorage.setItem(localStorageKey, JSON.stringify(currentList));
        inputFieldElement.value = "";

        refreshRssFeeds();
    } catch (error) {
        console.log(error);
    }
}

function refreshRssFeeds() {
    let currentList = localStorage.getItem(localStorageKey);
    const listElement = document.getElementById('feed-list');
    if (!currentList || currentList == "[]") {
        listElement.innerText = "Unfortunately, you don't seem to have any RSS feeds loaded. Try adding some below and we'll display what they have";
    } else {
        listElement.innerText = "";
        currentList = JSON.parse(currentList);
        for (let url of currentList) {
            feednami.load(url)
                .then(feed => {
                    console.log(feed);
                    const outerElement = listElement.appendChild(document.createElement("div"));
                    const header = document.createElement("h2");
                    header.innerText = feed.meta.title;
                    outerElement.appendChild(header);
                    for (let entry of feed.entries) {
                        const innerElement = document.createElement("div");
                        outerElement.appendChild(innerElement);
                        const anchor = document.createElement("a");
                        anchor.href = entry.link;
                        const titleHeader = document.createElement("h3");
                        titleHeader.innerText = entry.title;
                        anchor.appendChild(titleHeader);
                        anchor.setAttribute("target", "_BLANK");
                        innerElement.appendChild(anchor);
                        const summary = entry.summary;
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
                    }
                })
        }
    }
}

function refreshFeedsToRemoveList() {
    let currentList = localStorage.getItem(localStorageKey);
    const removalListElement = document.getElementById('feeds-to-delete-list');
    removalListElement.innerHTML = "";
    if (!currentList || currentList.length == 0) {
        return;
    }

    currentList = JSON.parse(currentList);
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
    let currentList = localStorage.getItem(localStorageKey);
    if (!currentList || currentList.length == 0) {
        return;
    }

    currentList = JSON.parse(currentList);

    let index = currentList.indexOf(url);
    if (index !== -1) {
        currentList.splice(index, 1);
        localStorage.setItem(localStorageKey, JSON.stringify(currentList));
    }

    refreshFeedsToRemoveList();
    refreshRssFeeds();
}
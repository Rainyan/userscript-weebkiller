// ==UserScript==
// @name            Weeb killer
// @description     If a YouTube live stream's title is in Japanese, filter out all the comments that aren't. Code logic is based on Emubure's "Flow Youtube Chat" userscript.
// @namespace       YtWeebKiller
// @version         0.8.2
// @author          Original "Flow Youtube Chat" userscript code by Emubure, this userscript fork by rain
// @match           https://www.youtube.com/*
// @updateURL       https://cdn.jsdelivr.net/gh/Rainyan/userscript-weebkiller@main/weebkiller.user.js
// @run-at          document-idle
// @noframes
// ==/UserScript==

"use strict";

const PRINT_DEBUG_LOG = false;

let storedHref = "";
// Used for tracking the found state, so that we can only parse the dom when needed.
let found_chat_field = false;
let findInterval = null;

findChatField();

function log(text) {
    if (PRINT_DEBUG_LOG) {
        console.log(text);
    }
}

function IsJapanese(text) {
    // Credit: https://gist.github.com/sym3tri/980083
    const regex = /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g;
    return regex.test(text);
}

function getPageTitle() {
    // This regex matching idea is borrowed from pcouy's YoutubeAutotranslateCanceler,
    // Copyright (c) 2020 Pierre Couy, used under the MIT License:
    // https://github.com/pcouy/YoutubeAutotranslateCanceler/blob/master/LICENSE
    const match = document.title.match(/^(?:\([0-9]+\) )?(.*?)(?: - YouTube)$/); // ("(n) ") + "TITLE - YouTube"
    return match ? match[1] : "";
}

// Can't use mutation observer for Youtube's in-place page loading voodoo, so just loop like a madman
function youtubeSucks() {
    if(storedHref !== location.href) {
        if (IsJapanese(getPageTitle())) {
            log("URL Changed", storedHref, location.href);
            findChatField();
            storedHref = location.href;
        }
        // Not a Japanese video title - don't filter comments
        else {
            ChatFieldObserver.disconnect();
        }
    }
}
setInterval(youtubeSucks, 1000);

let LIVE_PAGE = {
    getChatField: () => {
        const chatFrame = document.getElementById("chatframe");
        const contentDoc = chatFrame ? chatFrame.contentDocument : null;
        // Can be null if chat window is minimized by user, which would throw an error, so we check.
        if (contentDoc !== null) {
            return contentDoc.querySelector("#items.style-scope.yt-live-chat-item-list-renderer");
        }
        return null;
    }
};

function findChatField() {
    let FindCount = 1;
    clearInterval(findInterval);
    findInterval = setInterval(function() {
        if (found_chat_field && LIVE_PAGE.getChatField() === null) {
            found_chat_field = false;
        }
        if (found_chat_field) {
            return;
        }

        ++FindCount;
        if (FindCount > 180) {
            log("The chat element cannot be found");
            clearInterval(findInterval);
            FindCount = 0;
        }
        if (document.getElementById("chatframe")) {
           if (LIVE_PAGE.getChatField() !== null) {
               log("Found the chat element: ");
               log(LIVE_PAGE.getChatField());
               found_chat_field = true;

               initialize();

               // Don't clearInterval, because we wanna keep on tracking
               // for any new chat fields in case user closed/minimized the chat.
               //clearInterval(findInterval);

               FindCount = 0;
           }
        }
    }, 250);
}

function initialize() {
    log("initialize...");

    if (LIVE_PAGE.getChatField() !== null) {
        ChatFieldObserver.disconnect();
        ChatFieldObserver.observe(LIVE_PAGE.getChatField(), {childList: true});
    }
}

const ChatFieldObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(e) {
        let addedChats = e.addedNodes;
        for (let i = 0; i < addedChats.length; ++i) {
            const commentText = convertChat(addedChats[i]);
            if ((commentText.length > 0) &&
               (!commentText.includes(" was gifted a membership by ")) &&
               (!IsJapanese(commentText)))
            {
                addedChats[i].style.display="none";
                log("Chat message was filtered: \"" + commentText + "\"");
            }
        }
    });
});

function convertChat(chat) {
    let text = "";
    //チャットの子要素を見ていく
    let children = Array.from(chat.children);
    children.some(_chat => {
        let childID = _chat.id;
        if (childID === "content") {
            text = Array.from(_chat.children).find((v) => v.id === "message").innerText;
        }
        //スパチャの場合
        else if(childID === "card") {
            //通常
            if (_chat.className === "style-scope yt-live-chat-paid-message-renderer") {
                if (content && content.children) {
                    text = content.children[0].innerText;
                }
            }
        }
    });
    return text;
}

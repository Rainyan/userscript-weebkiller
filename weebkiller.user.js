// ==UserScript==
// @name            Weeb killer
// @description     If a YouTube live stream's title is in Japanese, filter out all the comments that aren't. Code logic is based on Emubure's "Flow Youtube Chat" userscript.
// @namespace       YtWeebKiller
// @version         0.12.0
// @author          Original "Flow Youtube Chat" userscript code by Emubure, this userscript fork by rain
// @match           https://www.youtube.com/*
// @updateURL       https://cdn.jsdelivr.net/gh/Rainyan/userscript-weebkiller@main/weebkiller.user.js
// @run-at          document-idle
// @noframes
// ==/UserScript==

"use strict";

const WK_PRINT_DEBUG_LOG = false;

var WK_IS_ACTIVE = false;
let WK_STORED_HREF = "";
// Used for tracking the found state, so that we can only parse the dom when needed.
let WK_FOUND_CHAT_FIELD = false;
let WK_FIND_INTERVAL = null;

findChatField();

function log(text) {
  if (WK_PRINT_DEBUG_LOG) {
    console.log(text);
  }
}

function IsJapanese(text) {
  // Credit: https://gist.github.com/sym3tri/980083
  const regex =
    /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g;
  return regex.test(text);
}

function getPageTitle() {
  // This regex matching idea is borrowed from pcouy's YoutubeAutotranslateCanceler,
  // Copyright (c) 2020 Pierre Couy, used under the MIT License:
  // https://github.com/pcouy/YoutubeAutotranslateCanceler/blob/master/LICENSE
  const match = document.title.match(/^(?:\([0-9]+\) )?(.*?)(?: - YouTube)$/); // ("(n) ") + "TITLE - YouTube"
  return match ? match[1] : document.title.split(" - YouTube")[0];
}

// Can't use mutation observer for Youtube's in-place page loading voodoo, so just loop like a madman
function youtubeSucks() {
  if (WK_STORED_HREF !== location.href) {
    log("URL Changed", WK_STORED_HREF, location.href);
    WK_IS_ACTIVE = IsJapanese(getPageTitle());
    if (WK_IS_ACTIVE) {
      findChatField();
      WK_STORED_HREF = location.href;
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
    if (contentDoc === null) {
      return null;
    }
    return contentDoc.querySelector(
      "#items.style-scope.yt-live-chat-item-list-renderer"
    );
  },
  getIconButton: () => {
    const chatFrame = document.getElementById("chatframe");
    const contentDoc = chatFrame ? chatFrame.contentDocument : null;
    // Can be null if chat window is minimized by user, which would throw an error, so we check.
    if (contentDoc === null) {
      return null;
    }

    return contentDoc.getElementById("action-buttons");

    let elems = contentDoc.getElementsByTagName("yt-live-chat-header-renderer");
    if (elems.length === 1) {
      let btn = elems[0].getElementsByTagName("yt-live-chat-button");
      if (btn.length === 1) {
        return btn[0]; //.querySelector("#items.style-scope.yt-button-renderer");
      }
    }
    return null;
  },
};

function findChatField() {
  let FindCount = 1;
  clearInterval(WK_FIND_INTERVAL);
  WK_FIND_INTERVAL = setInterval(function () {
    if (WK_FOUND_CHAT_FIELD && LIVE_PAGE.getChatField() === null) {
      WK_FOUND_CHAT_FIELD = false;
    }
    if (WK_FOUND_CHAT_FIELD) {
      return;
    }

    ++FindCount;
    if (FindCount > 180) {
      log("The chat element cannot be found");
      clearInterval(WK_FIND_INTERVAL);
      FindCount = 0;
    }

    if (LIVE_PAGE.getChatField() === null) {
      return;
    }
    WK_FOUND_CHAT_FIELD = true;
    initialize();
    // Don't clearInterval, because we wanna keep on tracking
    // for any new chat fields in case user closed/minimized the chat.

    FindCount = 0;
  }, 250);
}

function initialize() {
  log("initialize...");

  let chatField = LIVE_PAGE.getChatField();
  if (chatField !== null) {
    ChatFieldObserver.disconnect();
    ChatFieldObserver.observe(chatField, { childList: true });
  }

  let iconButton = LIVE_PAGE.getIconButton();
  if (iconButton !== null) {
    var btn = null;
    for (var i = 0; i < iconButton.children.length; ++i) {
      if (iconButton.children[i].id === "weebtoggle") {
        btn = iconButton.children[i];
        break;
      }
    }
    if (btn === null) {
      let nihongo = "漢字/仮名";
      let zengengo = "全言語";
      btn = document.createElement("button");
      btn.innerHTML = '<button id="weebtoggle">';
      btn.addEventListener(
        "click",
        () => {
          WK_IS_ACTIVE = !WK_IS_ACTIVE;
          btn.textContent = WK_IS_ACTIVE ? nihongo : zengengo;
        },
        false
      );
      iconButton.appendChild(btn);
      btn.textContent = WK_IS_ACTIVE ? nihongo : zengengo;
    }
  }
}

// When filtering is enabled (WK_IS_ACTIVE),
// returns a boolean of whether this message should be displayed.
function ShouldDisplayMessage(message) {
	// Show messages with Japanese characters
	if (IsJapanese(message)) {
		return true;
	}
	// Show the membership gift messages by YouTube
	if (message.includes(" was gifted a membership by ")) {
		return true;
	}
	// Show messages which are a URL hyperlink
	if (message.startsWith("http")) {
		return true;
	}
	// Show alphabet version of 草/笑
	if (Array.from(message).every(character => character === "w")) {
		return true;
	}
	return false;
}

const ChatFieldObserver = new MutationObserver(function (mutations) {
  if (WK_IS_ACTIVE) {
    mutations.forEach(function (e) {
      let addedChats = e.addedNodes;
      for (let i = 0; i < addedChats.length; ++i) {
        const commentText = convertChat(addedChats[i]);
        if (!ShouldDisplayMessage(commentText)) {
          addedChats[i].style.display = "none";
          log('Chat message was filtered: "' + commentText + '"');
        }
      }
    });
  }
});

function convertChat(chat) {
  let text = "";
  //チャットの子要素を見ていく
  let children = Array.from(chat.children);
  children.some((_chat) => {
    let childID = _chat.id;
    if (childID === "content") {
      text = Array.from(_chat.children).find(
        (v) => v.id === "message"
      ).innerText;
    }
    //スパチャの場合
    else if (childID === "card") {
      //通常
      if (
        _chat.className === "style-scope yt-live-chat-paid-message-renderer"
      ) {
        if (content && content.children) {
          text = content.children[0].innerText;
        }
      }
    }
  });
  return text;
}

// ==UserScript==
// @name            Weeb killer
// @description     If a YouTube live stream's title is in Japanese, filter out all the comments that aren't. Code logic is based on Emubure's "Flow Youtube Chat" userscript.
// @namespace       YtWeebKiller
// @version         0.4.0
// @author          Original "Flow Youtube Chat" userscript code by Emubure, this userscript fork by rain
// @domain          https://www.youtube.com
// @match           https://www.youtube.com/watch*
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js
// @updateURL       https://cdn.jsdelivr.net/gh/Rainyan/userscript-weebkiller@main/weebkiller.user.js
// @run-at          document-idle
// @grant           unsafeWindow
// @noframes
// ==/UserScript==

const PRINT_DEBUG_LOG = false;

this.$ = this.jQuery = jQuery.noConflict(true);

function log(text) {
    if (PRINT_DEBUG_LOG) {
        console.log(text);
    }
}

function IsJapanese(text) {
    // Credit: https://gist.github.com/ryanmcgrath/982242
    var regex = /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g;
    return regex.test(text);
}

$(window).on('load', function() {
    let LIVE_PAGE = {
        getChatField: ()=>{
            let contentDoc = document.getElementById('chatframe').contentDocument;
            // Can be null if chat window is minimized by user, which would throw an error, so we check.
            if (contentDoc !== null) {
                return contentDoc.querySelector("#items.style-scope.yt-live-chat-item-list-renderer");
            }
            return null;
        }
    }
    
    // Used for tracking the found state, so that we can only parse the dom when needed.
    var found_chat_field = false;
  
    let storedHref = location.href;
    const URLObserver = new MutationObserver(function(mutations){
        mutations.forEach(function(mutation){
            if(storedHref !== location.href){
                findChatField()
                storedHref = location.href
                log('URL Changed', storedHref, location.href)
            }
        })
    })
    
    $(document).ready(() => {
        // This regex matching idea is borrowed from pcouy's YoutubeAutotranslateCanceler,
        // Copyright (c) 2020 Pierre Couy, used under the MIT License:
        // https://github.com/pcouy/YoutubeAutotranslateCanceler/blob/master/LICENSE
        var titleMatch = document.title.match (/^(?:\([0-9]+\) )?(.*?)(?: - YouTube)$/); // ("(n) ") + "TITLE - YouTube"
        if (!IsJapanese(titleMatch[1])) {
            log("Not Japanese title; won't filter live chat: " + titleMatch[1]);
        } else {
            log("Is Japanese title; will filter live chat: " + titleMatch[1]);
            //チャット欄とプレイヤーが出るまで待つ
            findChatField()
        }
    })
    
    var findInterval
    function findChatField(){
        let FindCount = 1
        clearInterval(findInterval)
        findInterval = setInterval(function(){
            if(found_chat_field && LIVE_PAGE.getChatField() === null) {
                found_chat_field = false;
            }
            if (found_chat_field) {
                return;
            }
          
            FindCount++
            if(FindCount > 180){
                log('The element cannot be found')
                clearInterval(findInterval)
                FindCount = 0
            }
            if(document.getElementById('chatframe')){
               if(LIVE_PAGE.getChatField() !== null){
                   log('Found the element: ')
                   log(LIVE_PAGE.getChatField())
                   found_chat_field = true;

                   initialize()

                   // Don't clearInterval, because we wanna keep on tracking
                   // for any new chat fields in case user closed/minimized the chat.
                   //clearInterval(findInterval)
                 
                   FindCount = 0
               }
            }
        }, 1000)
    }
    
    function initialize(){
        log('initialize...')

        URLObserver.disconnect()
        URLObserver.observe(document, {childList: true, subtree: true})

        if((LIVE_PAGE.getChatField() !== null)){
            ChatFieldObserver.disconnect()
            ChatFieldObserver.observe(LIVE_PAGE.getChatField(), {childList: true})
        }
    }
    
    const ChatFieldObserver = new MutationObserver(function(mutations){
        mutations.forEach(function(e){
            let addedChats = e.addedNodes
            for(let i = 0; i < addedChats.length; i++){

                const commentText = convertChat(addedChats[i])

                if((commentText.length > 0) &&
                   (!commentText.includes(" was gifted a membership by ")) &&
                   (!IsJapanese(commentText)))
                {
                    addedChats[i].style.display='none'
                    log("Chat message was filtered: \"" + commentText + "\"")
                }
            }
        })
    })
    
    function convertChat(chat){
        let text = ''

        //チャットの子要素を見ていく
        let children = Array.from(chat.children)
        children.some(_chat =>{

            let childID = _chat.id

            if(childID === 'content'){
                text = Array.from(_chat.children).find((v) => v.id === 'message').innerText
            }
            //スパチャの場合
            else if(childID === 'card'){
                //通常
                if(_chat.className === 'style-scope yt-live-chat-paid-message-renderer'){
                    text = content.children[0].innerText
                }
            }
        })
        
        return text
    }
});
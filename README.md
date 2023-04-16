![Download stats](https://data.jsdelivr.com/v1/package/gh/Rainyan/userscript-weebkiller/badge?style=rounded)
[![CodeQL](https://github.com/Rainyan/userscript-weebkiller/actions/workflows/codeql.yml/badge.svg)](https://github.com/Rainyan/userscript-weebkiller/actions/workflows/codeql.yml)

# userscript-weebkiller

If a YouTube live stream's title is in Japanese, filter out all the live chat comments that aren't.

日本語メインのYouTube配信から英語などで書いたコメントを非表示にできる視聴者用のユーザースクリプトです。隠す機能は、配信タイトルが日本語の文字を含む時のみ発動します。また、チャット欄にあるボタンで機能はオンオフできます。

The code is based on Emubure's "Flow Youtube Chat" userscript, which apparently has since gone offline, but has been forked [to here](https://github.com/gepz/userscript/tree/main/packages/flow-youtube-chat).

## Installation

First, you'll need a [userscript manager](https://en.wikipedia.org/wiki/Userscript_manager) for your browser. If you don't have a preference, I'd suggest [Violentmonkey](https://violentmonkey.github.io/).

Click here for a [direct download link to the userscript](https://github.com/Rainyan/userscript-weebkiller/raw/main/weebkiller.user.js), which should initiate the installation for most managers. If not, copy-paste the code contents to your userscript manager as appropriate.

Tested with Violentmonkey/Firefox, but it should probably work with other userscript managers/browsers as well.

## Example

Before                     |  After
:-------------------------:|:-------------------------:
![](https://user-images.githubusercontent.com/6595066/232327297-8f1be79c-d304-4240-9214-01a536dddf3d.png)  |  ![](https://user-images.githubusercontent.com/6595066/232327314-65a9d3db-2d48-476b-acbf-b54c9e50a444.png)

...and yes, I am aware of the irony in this script's naming 😀

## Troubleshooting

* The chat box is flickering
  * Try hiding and then re-displaying the chat window using the YT chat window UI buttons.
* The script is not filtering messages
  * Try reloading the video page without cache (usually `CTRL+F5` or `SHIFT+F5`, depending on browser).

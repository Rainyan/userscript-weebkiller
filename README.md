# userscript-weebkiller

If a YouTube live stream's title is in Japanese, weed out all the live chat comments that aren't.

日本語メインのYouTube配信から英語などで書いたコメントを隠せる視聴者側用のユーザースクリプトです。隠す機能は、配信タイトルが日本語の文字を含む時のみ発動します。

The code is based on Emubure's "Flow Youtube Chat" userscript, which apparently has since gone offline, but has been forked [to here](https://github.com/gepz/userscript/tree/main/packages/flow-youtube-chat).

## Installation
First you'll need a [userscript manager](https://en.wikipedia.org/wiki/Userscript_manager) for your browser. If you don't have a preference, I'd suggest [Violentmonkey](https://violentmonkey.github.io/).

[Direct link to the userscript](https://github.com/Rainyan/userscript-weebkiller/raw/main/weebkiller.user.js), which should initiate the installation for most managers.

Tested on Violentmonkey, but it should probably work on other userscript managers as well.

## Example

Before                     |  After
:-------------------------:|:-------------------------:
![](https://user-images.githubusercontent.com/6595066/173186270-a636f228-0ed8-4b9d-a981-fd5e1263650b.png)  |  ![](https://user-images.githubusercontent.com/6595066/173186274-562fd475-255e-4cc0-8adc-f141b3aa9b96.png)

## FAQ/Troubleshooting

* _It doesn't work for some live streams/VODs._
  * The script activates only if the title of the stream has Japanese characters in it. Since YouTube has started auto-translating video titles, this can disrupt the detection. I'd recommend you try the [YT Auto Translate Canceler](https://github.com/pcouy/YoutubeAutotranslateCanceler/) userscript to work around this issue.
* _Are you unaware of the irony of this script's naming?_
  * No 😀

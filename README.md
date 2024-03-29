<!--
 * @Description:
 * @Author: weiyang
 * @Date: 2022-06-29 13:40:41
 * @LastEditors: weiyang
 * @LastEditTime: 2023-04-04 11:32:48
-->

# bc-player

[![avatar](https://img.shields.io/badge/npm-v1.0.0--beta.32-blue)](https://github.com/royalscome/bc-player)<br/>

## introduce

<p>基于canvas实现的视频控件，提供视频切割及视频局部放大功能及音频切换</p>
<p>Video control based on Canvas provides video cutting and local video magnification functions</p>

## 参数（argument）

| 参数名          | 参数类型 | 可选值                                       | 默认值                                         | 是否必传 | 备注                                                                                                          |
| --------------- | -------- | -------------------------------------------- | ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| id              | String   | /                                            | "video"                                        | 是       | 容器 id，必须是 id 选择器                                                                                     |
| url             | String   | /                                            | /                                              | 是       | 视频地址，支持 video 标签所支持的所有视频类型   
| line            | Number   | /                                            | 1                                              | 否       | 视频所需切割为几行                                                                |
| pictureNumber            | Number   | /                          |  column*line                   | 否       | 有多少个画面切                                                                                      |
| column          | Number   | /                                            | 1                                              | 否       | 视频所需切割为几列                                                                                            |
| showProgressBar | Boolean  | true/false                                   | true                                           | 否       | 是否展示视频进度条，默认展示                                                                                  |
| showTime        | Boolean  | true/false                                   | true                                           | 否       | 是否展示视频时长和当前播放时间，默认展示                                                                      |
| buttonList      | Array    | "switchPicture", "enlarge", "audio", "speed" | ["switchPicture", "enlarge", "audio", "speed"] | 否       | 对应关系：{"switchPicture"："前后画面切换", "enlarge": "画面放大缩小", "audio": "音频切换", "speed": "倍速" } |
| audioList       | Array    | /                                            | /                                              | 否       | 音频源地址，不传即使用视频本身声音                                                                            |
| stopClickPlay   | Boolean  | true/false                                   | fasle                                          | 否       | 是否禁用播放暂停按钮事件，用于 js 控制播放暂停                                                                |

```javascript
npm install @royalscome/bc-player

const player = new bcPlayer({
      id: "video",
      url: "./aaa.mp4",
      line: 3,
      column: 2,
      buttonList: ["switchPicture", "enlarge", "audio"],
      audioList: [
        "xxxx.mp4",
        "xxxx.mp4",
        "xxxx.mp4",
      ],
    });

```

## 切换视频

<p>切换视频前请调用destroy()方法清空后再创建新的player</p>

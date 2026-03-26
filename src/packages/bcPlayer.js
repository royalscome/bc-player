import useCanavs from "./utils/drawCanvas.js";
import { getHMS, getElement } from "./utils/util.js";
import { videoElementMethods } from "./modules/videoElement.js";
import { controlsMethods } from "./modules/controls.js";

class bcPlayer {
  // 视频源真实宽高（_ 前缀约定私有，供 mixin 方法访问）
  _realVideoWidth = 0;
  _realVideoHeight = 0;
  pictureIndex = 0;
  maxPictureIndex = 0;
  played = false;
  paused = true;
  isEnlarge = false;
  showProgressBar = true;
  showTime = true;
  showOption = true;
  needVideo = true;
  initVideo = {
    currentTime: 0,
    videoLength: 0,
    formatCurrentTime: "00:00:00",
    formatVideoLength: "00:00:00",
  };
  _render = null;
  _startX = 0;
  _startY = 0;
  _endX;
  _endY;
  speed = 1;
  speedList = [];
  audioIndex = 0;
  audioList = [];
  constructor(configuration) {
    this.configuration = configuration;
    this.tag = this.generateRandomCode(10);
    const {
      showProgressBar = true,
      showTime = true,
      showOption = true,
      needVideo = true,
    } = this.configuration;
    this.showProgressBar = showProgressBar;
    this.showTime = showTime;
    this.showOption = showOption;
    this.needVideo = needVideo;
    this.observers = [];
    this.loadeddataHandler = null;
    this.loadedmetadataHandler = null;
    this.timeupdateHandler = null;
    this._validate() && this.draw();
    this.play = () => {
      const playDom = getElement("play-tag", this.tag);
      const pausedDom = getElement("pause-tag", this.tag);
      const videoDom = this.needVideo
        ? getElement("video-tag", this.tag)
        : document.getElementById(this.configuration.videoId);
      const audioDom = getElement("audio-tag", this.tag);
      const canvasDom = getElement("canvas-tag", this.tag);
      const newConfiguration = this.getConfiguration();
      const { line = 1, column = 1 } = newConfiguration;
      const { loop, switchXy, switchWh, zoomLoop } = useCanavs(
        canvasDom,
        this.needVideo ? "" : this.configuration.videoId,
        line,
        column,
        this.needVideo,
        this.tag
      );
      this.playHandler(
        playDom,
        pausedDom,
        videoDom,
        loop,
        zoomLoop,
        switchXy,
        switchWh,
        audioDom
      );
    };
    this.pause = () => {
      const playDom = getElement("play-tag", this.tag);
      const pausedDom = getElement("pause-tag", this.tag);
      const videoDom = this.needVideo
        ? getElement("video-tag", this.tag)
        : document.getElementById(this.configuration.videoId);
      const audioDom = getElement("audio-tag", this.tag);
      const canvasDom = getElement("canvas-tag", this.tag);
      const newConfiguration = this.getConfiguration();
      const { line = 1, column = 1 } = newConfiguration;
      const { loop, switchXy, switchWh, zoomLoop } = useCanavs(
        canvasDom,
        this.needVideo ? "" : this.configuration.videoId,
        line,
        column,
        this.needVideo,
        this.tag
      );
      this.pasueHandler(
        playDom,
        pausedDom,
        videoDom,
        loop,
        zoomLoop,
        switchXy,
        switchWh,
        audioDom
      );
    };
    this.setTime = (time) => {
      const { audioList = [], videoId } = this.configuration;
      const audioDom = getElement("audio-tag", this.tag);
      const videoDom = this.needVideo
        ? getElement("video-tag", this.tag)
        : document.getElementById(videoId);
      videoDom.currentTime = time;
      audioList.length >= 1 && (audioDom.currentTime = time);
    };
    this.getNowPlayTime = () => {
      return this.initVideo.currentTime;
    };
    this.getNowPictureIndex = () => {
      return this.pictureIndex;
    };
    this.getNowAudioIndex = () => {
      return this.audioIndex;
    };
    this.setPictureIndex = (index) => {
      if (Number(index) > this.maxPictureIndex || Number(index) < 0) {
        return;
      }
      this.pictureIndex = Number(index);
      this.onPictureIndexChange(this.pictureIndex);
      this.modifyText();
      this.drawFirstPicture(
        this.pictureIndex,
        this._realVideoWidth,
        this._realVideoHeight
      );
      this._render = this.loop(
        this.pictureIndex,
        this._realVideoWidth,
        this._realVideoHeight,
        true
      );
    };
    this.getConfiguration = () => {
      return this.configuration;
    };
  }

  _console(type, message) {
    console[type](message);
    return type !== "error";
  }
  _validate() {
    const { url = "", needVideo = true } = this.configuration;
    if (!url && needVideo) {
      return this._console("error", "url must be passed, expect a correct url");
    } else {
      return true;
    }
  }
  generateRandomCode(length) {
    const str = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += str[Math.floor(Math.random() * str.length)];
    }
    return result;
  }
  // 设置父级样式
  _setParentStyle() {
    const { id = "video", zIndex = 1000 } = this.configuration;
    const parentElement = document.getElementById(id);
    parentElement.style.position = "relative";
    parentElement.style.zIndex = String(zIndex);
    parentElement.style.overflow = "hidden";
  }
  // 获取父级宽高
  _getWidthAndHeight() {
    const { id = "video" } = this.configuration;
    const parentElement = document.getElementById(id);
    const eleDom = parentElement.getBoundingClientRect();
    return {
      width: eleDom.width,
      height: eleDom.height,
    };
  }
  _resetCoordinates() {
    this._startX = 0;
    this._startY = 0;
    this._endX = 0;
    this._endY = 0;
  }

  destroy(callBack) {
    const { needVideo = true, videoId } = this.configuration;
    if (!needVideo) {
      const video = document.getElementById(videoId);
      video.removeEventListener("loadeddata", this.loadeddataHandler);
      video.removeEventListener("loadedmetadata", this.loadedmetadataHandler);
      video.removeEventListener("timeupdate", this.timeupdateHandler);
    }
    const videoDom = getElement("video-tag", this.tag);
    const audioDom = getElement("audio-tag", this.tag);
    videoDom && videoDom.pause();
    audioDom && audioDom.pause();
    const { id } = this.configuration;
    const parentElement = document.getElementById(id);
    // 清除所有子元素
    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }
    callBack && callBack()
  }
  draw() {
    const {
      line = 1,
      column = 1,
      audioList,
      buttonList = ["switchPicture", "enlarge", "audio"],
      pictureIndex,
      videoTime,
      audioIndex,
      needVideo = true,
      videoId,
    } = this.configuration;
    this.maxPictureIndex = line * column - 1;
    pictureIndex && (this.pictureIndex = pictureIndex);
    audioIndex && (this.audioIndex = audioIndex);
    this._setParentStyle();
    this._getWidthAndHeight();
    const canvasDom = this._createCanavas();
    const { drawFirstPicture, loop, switchXy, switchWh, zoomLoop } = useCanavs(
      canvasDom,
      needVideo ? "" : videoId,
      line,
      column,
      this.needVideo,
      this.tag
    );
    this.loop = loop;
    this.drawFirstPicture = drawFirstPicture;
    this.zoomLoop = zoomLoop;
    if (needVideo) {
      const videoDom = this._createVideoElement(drawFirstPicture, videoTime);
      if (audioList && audioList.length > 0 && buttonList.includes("audio")) {
        const audioDom = this._createAudioDom(videoTime);
        this._createControls(
          drawFirstPicture,
          videoDom,
          loop,
          switchXy,
          switchWh,
          zoomLoop,
          audioDom,
          audioIndex
        );
      } else {
        this._createControls(
          drawFirstPicture,
          videoDom,
          loop,
          switchXy,
          switchWh,
          zoomLoop,
          ""
        );
      }
    } else {
      this._getVideoElement(drawFirstPicture, videoId, videoTime).then(
        (videoDom) => {
          if (
            audioList &&
            audioList.length > 0 &&
            buttonList.includes("audio")
          ) {
            const audioDom = this._createAudioDom(videoTime);
            if (!this.showOption) {
              return;
            }
            this._createControls(
              drawFirstPicture,
              videoDom,
              loop,
              switchXy,
              switchWh,
              zoomLoop,
              audioDom,
              audioIndex
            );
          } else {
            if (!this.showOption) {
              return;
            }
            this._createControls(
              drawFirstPicture,
              videoDom,
              loop,
              switchXy,
              switchWh,
              zoomLoop,
              ""
            );
          }
        }
      );
    }
  }
}

Object.assign(bcPlayer.prototype, videoElementMethods);
Object.assign(bcPlayer.prototype, controlsMethods);

export default bcPlayer;

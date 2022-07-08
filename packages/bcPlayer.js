/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-06-29 15:16:13
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-08 17:28:59
 */
import useCanavs from "./utils/drawCanvas.js";
import scale from "./utils/scale.js";
import { getHMS } from "./utils/util.js";
class bcPlayer {
  // 视频源真实宽高
  #realVideoWidth = 0;
  #realVideoHeight = 0;
  // 当前选中画面
  pictureIndex = 0;
  maxPictureIndex = 0;
  played = false;
  paused = true;
  // 是否放大
  isEnlarge = false;
  initVideo = {
    currentTime: 0, // 当前播放时间
    videoLength: 0, // 总时间
    formatCurrentTime: "00:00:00", // 格式化的时长
    formatVideoLength: "00:00:00", // 格式化的当前播放时间
  };
  #render = null;
  constructor(configuration) {
    this.configuration = configuration;
    this._validate() && this.draw();
  }
  _console(type, message) {
    console[type](message);
    return !type === "error";
  }
  _validate() {
    const { url = "" } = this.configuration;
    if (!url) {
      return this._console("error", "url must be passed, expect a correct url");
    } else {
      return true;
    }
  }
  // 设置父级样式
  _setParentStyle() {
    const { id = "video", zIndex = 1000 } = this.configuration;
    const parentElement = document.getElementById(id);
    parentElement.style.position = "relative";
    parentElement.style.zIndex = String(zIndex);
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
  // 创建video
  _createVideoElement(drawFirstPicture) {
    const { url, audioList = [], id = "video" } = this.configuration;
    const video = document.createElement("video");
    audioList.length >= 1 && (video.muted = true);
    audioList.length === 0 && (video.muted = false);
    video.autoplay = false;
    video.src = url;
    video.id = "bc-video";
    video.style.width = "0";
    video.style.height = "0";
    function setRealSizeAndFirstPicture(e) {
      console.log("canplay");
      this.#realVideoWidth = e.target.videoWidth;
      this.#realVideoHeight = e.target.videoHeight;
      setTimeout(() => {
        drawFirstPicture(
          this.pictureIndex,
          this.#realVideoWidth,
          this.#realVideoHeight
        );
      }, 500);
    }
    function setVideoTime(e) {
      this.initVideo.videoLength = e.target.duration;
      this.initVideo.formatVideoLength = getHMS(e.target.duration);
      const dom = document.getElementsByClassName("bc-timer");
      dom[0].innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
      const scale1 = new scale(
        "bc-slider-btn",
        "bc-outBar",
        "bc-inline-slider",
        this.initVideo.videoLength,
        (e) => {
          video.currentTime = e;
          this.initVideo.currentTime = e;
          this.initVideo.formatCurrentTime = getHMS(e);
          dom[0].innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
        }
      );
      console.log(scale1);
    }
    function handleVideoTimeUpdate(e) {
      const dom = document.getElementsByClassName("bc-timer");
      this.initVideo.currentTime = e.target.currentTime;
      this.initVideo.formatCurrentTime = getHMS(e.target.currentTime);
      dom[0].innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
      const outBarDom = document.getElementById("bc-outBar");
      const inlineBarDom = document.getElementById("bc-inline-slider");
      const btnDom = document.getElementById("bc-slider-btn");
      const x =
        (this.initVideo.currentTime / this.initVideo.videoLength) *
        outBarDom.getBoundingClientRect().width;
      const leftData = x - 4;
      inlineBarDom.style.width = Math.max(0, x) + "px";
      btnDom.style.left = leftData + "px";
      if (video.ended) {
        this.played = false;
        this.paused = true;
        const playDom = document.getElementById("bc-play");
        const pauseDom = document.getElementById("bc-pause");
        playDom.style.display = "block";
        pauseDom.style.display = "none";
      }
    }
    video.addEventListener("canplay", setRealSizeAndFirstPicture.bind(this));
    video.addEventListener("loadedmetadata", setVideoTime.bind(this));
    video.addEventListener("timeupdate", handleVideoTimeUpdate.bind(this));
    const parentElement = document.getElementById(id);
    parentElement.appendChild(video);
    return video;
  }
  // 创建视频层
  _createCanavas() {
    const { id = "video", zIndex = 1000 } = this.configuration;
    const { width, height } = this._getWidthAndHeight();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.id = "bc-canvas";
    canvas.style.position = "absolute";
    canvas.style.zIndex = zIndex + 1;
    canvas.style.top = "0";
    canvas.style.left = "0";
    const parentElement = document.getElementById(id);
    parentElement.appendChild(canvas);
    return canvas;
  }
  _addButtonSpacing(dom) {
    dom.style.margin = "0 5px";
  }
  // 创建播放按钮
  _createPlayButton() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svgDom = document.createElementNS(SVG_NS, "svg");
    svgDom.setAttribute("width", "24");
    svgDom.setAttribute("height", "24");
    svgDom.setAttribute("viewBox", "0 0 48 48");
    svgDom.setAttribute("fill", "none");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "48");
    rect.setAttribute("height", "48");
    rect.setAttribute("fill", "white");
    rect.setAttribute("fill-opacity", "0.01");
    svgDom.appendChild(rect);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path);
    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute(
      "d",
      "M20 24V17.0718L26 20.5359L32 24L26 27.4641L20 30.9282V24Z"
    );
    path2.setAttribute("fill", "none");
    path2.setAttribute("stroke", "#ffffff");
    path2.setAttribute("stroke-width", "4");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "block";
    svgDom.id = "bc-play";
    return svgDom;
  }
  // 创建暂停按钮
  _createPausedButton() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svgDom = document.createElementNS(SVG_NS, "svg");
    svgDom.setAttribute("width", "24");
    svgDom.setAttribute("height", "24");
    svgDom.setAttribute("viewBox", "0 0 48 48");
    svgDom.setAttribute("fill", "none");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "48");
    rect.setAttribute("height", "48");
    rect.setAttribute("fill", "white");
    rect.setAttribute("fill-opacity", "0.01");
    svgDom.appendChild(rect);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path);
    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute("d", "M19 18V30");
    path2.setAttribute("fill", "none");
    path2.setAttribute("stroke", "#ffffff");
    path2.setAttribute("stroke-width", "4");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    const path3 = document.createElementNS(SVG_NS, "path");
    path3.setAttribute("d", "M29 18V30");
    path3.setAttribute("fill", "none");
    path3.setAttribute("stroke", "#ffffff");
    path3.setAttribute("stroke-width", "4");
    path3.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path3);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "none";
    svgDom.id = "bc-pause";
    return svgDom;
  }
  // 添加播放按钮事件
  _addPlayEvent(playDom, pausedDom, videoDom, loop) {
    playDom.onclick = () => {
      // this.#render && cancelAnimationFrame(this.#render);
      this.played = true;
      this.paused = false;
      playDom.style.display = "none";
      pausedDom.style.display = "block";
      videoDom.play();
      this.#render = loop(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
    };
  }
  // 添加暂停按钮事件
  _addPauseEvent(playDom, pausedDom, videoDom, loop) {
    pausedDom.onclick = () => {
      // this.#render && cancelAnimationFrame(this.#render);
      this.played = false;
      this.paused = true;
      playDom.style.display = "block";
      pausedDom.style.display = "none";
      videoDom.pause();
      this.#render = loop(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
    };
  }
  _createTime() {
    const dom = document.createElement("span");
    dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
    dom.style.fontSize = "14px";
    dom.style.color = "#ffffff";
    dom.className = "bc-timer";
    this._addButtonSpacing(dom);
    console.log("create");
    return dom;
  }
  _createPlayAndTimeArea(videoDom, loop) {
    const dom = document.createElement("div");
    dom.style.height = "100%";
    dom.style.display = "flex";
    dom.style.alignItems = "center";
    const playDom = this._createPlayButton();
    const pausedDom = this._createPausedButton();
    const timeDom = this._createTime();
    this._addPlayEvent(playDom, pausedDom, videoDom, loop);
    this._addPauseEvent(playDom, pausedDom, videoDom, loop);
    dom.appendChild(playDom);
    dom.appendChild(pausedDom);
    dom.appendChild(timeDom);
    return dom;
  }
  // 创建前一画面按钮
  _createPrePictureButton() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svgDom = document.createElementNS(SVG_NS, "svg");
    svgDom.setAttribute("width", "24");
    svgDom.setAttribute("height", "24");
    svgDom.setAttribute("viewBox", "0 0 48 48");
    svgDom.setAttribute("fill", "none");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "48");
    rect.setAttribute("height", "48");
    rect.setAttribute("fill", "white");
    rect.setAttribute("fill-opacity", "0.01");
    svgDom.appendChild(rect);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M34 36L22 24L34 12");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path);
    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute("d", "M14 12V36");
    path2.setAttribute("fill", "none");
    path2.setAttribute("stroke", "#ffffff");
    path2.setAttribute("stroke-width", "4");
    path2.setAttribute("stroke-linecap", "round");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    this._addButtonSpacing(svgDom);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "block";
    return svgDom;
  }
  // 创建后一画面按钮
  _createNextPictureButton() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svgDom = document.createElementNS(SVG_NS, "svg");
    svgDom.setAttribute("width", "24");
    svgDom.setAttribute("height", "24");
    svgDom.setAttribute("viewBox", "0 0 48 48");
    svgDom.setAttribute("fill", "none");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "48");
    rect.setAttribute("height", "48");
    rect.setAttribute("fill", "white");
    rect.setAttribute("fill-opacity", "0.01");
    svgDom.appendChild(rect);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M14 12L26 24L14 36");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path);
    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute("d", "M34 12V36");
    path2.setAttribute("fill", "none");
    path2.setAttribute("stroke", "#ffffff");
    path2.setAttribute("stroke-width", "4");
    path2.setAttribute("stroke-linecap", "round");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    this._addButtonSpacing(svgDom);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "block";
    return svgDom;
  }
  // 添加前一画面按钮事件
  _addPreEvent(preDom, drawFirstPicture, loop) {
    preDom.onclick = () => {
      this.#render && cancelAnimationFrame(this.#render);
      if (this.pictureIndex === 0) {
        this.pictureIndex = this.maxPictureIndex;
      } else {
        this.pictureIndex--;
      }
      drawFirstPicture(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
      this.#render = loop(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
    };
  }
  // 添加后一画面按钮事件
  _addNextEvent(nextDom, drawFirstPicture, loop) {
    nextDom.onclick = () => {
      this.#render && cancelAnimationFrame(this.#render);
      if (this.pictureIndex === this.maxPictureIndex) {
        this.pictureIndex = 0;
      } else {
        this.pictureIndex++;
      }
      drawFirstPicture(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
      this.#render = loop(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
    };
  }
  // 创建局部放大按钮
  _createEnlargeButton() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svgDom = document.createElementNS(SVG_NS, "svg");
    svgDom.setAttribute("width", "24");
    svgDom.setAttribute("height", "24");
    svgDom.setAttribute("viewBox", "0 0 48 48");
    svgDom.setAttribute("fill", "none");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "48");
    rect.setAttribute("height", "48");
    rect.setAttribute("fill", "white");
    rect.setAttribute("fill-opacity", "0.01");
    svgDom.appendChild(rect);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z"
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path);
    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute("d", "M21 15L21 27");
    path2.setAttribute("fill", "none");
    path2.setAttribute("stroke", "#ffffff");
    path2.setAttribute("stroke-width", "4");
    path2.setAttribute("stroke-linecap", "round");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    const path3 = document.createElementNS(SVG_NS, "path");
    path3.setAttribute("d", "M15 21L27 21");
    path3.setAttribute("fill", "none");
    path3.setAttribute("stroke", "#ffffff");
    path3.setAttribute("stroke-width", "4");
    path3.setAttribute("stroke-linecap", "round");
    path3.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path3);
    const path4 = document.createElementNS(SVG_NS, "path");
    path4.setAttribute("d", "M33.2218 33.2218L41.7071 41.7071");
    path4.setAttribute("fill", "none");
    path4.setAttribute("stroke", "#ffffff");
    path4.setAttribute("stroke-width", "4");
    path4.setAttribute("stroke-linecap", "round");
    path4.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path4);
    this._addButtonSpacing(svgDom);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "block";
    return svgDom;
  }
  // 创建取消局部放大按钮
  _createCancelEnlargeButton() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svgDom = document.createElementNS(SVG_NS, "svg");
    svgDom.setAttribute("width", "24");
    svgDom.setAttribute("height", "24");
    svgDom.setAttribute("viewBox", "0 0 48 48");
    svgDom.setAttribute("fill", "none");
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", "48");
    rect.setAttribute("height", "48");
    rect.setAttribute("fill", "white");
    rect.setAttribute("fill-opacity", "0.01");
    svgDom.appendChild(rect);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z"
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path);
    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute("d", "M15 21L27 21");
    path2.setAttribute("fill", "none");
    path2.setAttribute("stroke", "#ffffff");
    path2.setAttribute("stroke-width", "4");
    path2.setAttribute("stroke-linecap", "round");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    const path3 = document.createElementNS(SVG_NS, "path");
    path3.setAttribute("d", "M33.2218 33.2218L41.7071 41.7071");
    path3.setAttribute("fill", "none");
    path3.setAttribute("stroke", "#ffffff");
    path3.setAttribute("stroke-width", "4");
    path3.setAttribute("stroke-linecap", "round");
    path3.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path3);
    this._addButtonSpacing(svgDom);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "none";
    return svgDom;
  }
  _addEnlargeEvent(enlargeDom, cancelEnlargeDom) {
    enlargeDom.onclick = () => {
      this.isEnlarge = true;
      enlargeDom.style.display = "none";
      cancelEnlargeDom.style.display = "block";
    };
  }
  _addCancelEnlargeEvent(enlargeDom, cancelEnlargeDom) {
    cancelEnlargeDom.onclick = () => {
      this.isEnlarge = false;
      enlargeDom.style.display = "block";
      cancelEnlargeDom.style.display = "none";
    };
  }
  // 创建业务操作区域
  _createHandleArea(drawFirstPicture, loop) {
    const handleAreaDom = document.createElement("div");
    handleAreaDom.style.height = "100%";
    handleAreaDom.style.display = "flex";
    handleAreaDom.style.alignItems = "center";
    const preDom = this._createPrePictureButton();
    const nextDom = this._createNextPictureButton();
    const enlargeDom = this._createEnlargeButton();
    const cancelEnlargeDom = this._createCancelEnlargeButton();
    this._addPreEvent(preDom, drawFirstPicture, loop);
    this._addNextEvent(nextDom, drawFirstPicture, loop);
    this._addEnlargeEvent(enlargeDom, cancelEnlargeDom);
    this._addCancelEnlargeEvent(enlargeDom, cancelEnlargeDom);
    handleAreaDom.appendChild(preDom);
    handleAreaDom.appendChild(nextDom);
    handleAreaDom.appendChild(enlargeDom);
    handleAreaDom.appendChild(cancelEnlargeDom);
    return handleAreaDom;
  }
  _createSlider() {
    const outBarDom = document.createElement("div");
    outBarDom.style.width = "100%";
    outBarDom.style.height = "3px";
    outBarDom.style.backgroundColor = "#ffffff";
    outBarDom.style.borderRadius = "3px";
    outBarDom.style.position = "relative";
    outBarDom.id = "bc-outBar";
    const inlineBarDom = document.createElement("div");
    inlineBarDom.id = "bc-inline-slider";
    inlineBarDom.style.width = "0";
    inlineBarDom.style.height = "3px";
    inlineBarDom.style.position = "absolute";
    inlineBarDom.style.left = "0";
    inlineBarDom.style.bottom = "0";
    inlineBarDom.style.zIndex = 1;
    inlineBarDom.style.backgroundColor = "#0072ff";
    outBarDom.appendChild(inlineBarDom);
    const btnDom = document.createElement("div");
    btnDom.style.width = "12px";
    btnDom.style.height = "12px";
    btnDom.style.backgroundColor = "#ffffff";
    btnDom.style.borderRadius = "100%";
    btnDom.style.boxShadow = "0 0 6px 6px rgba(0, 114, 255, .2)";
    btnDom.style.position = "absolute";
    btnDom.style.top = "-4px";
    btnDom.style.left = "-4px";
    btnDom.style.zIndex = "2";
    btnDom.style.cursor = "pointer";
    btnDom.id = "bc-slider-btn";
    outBarDom.appendChild(btnDom);

    return outBarDom;
  }
  _addBtnEvent(dom) {}
  // 创建控制条
  _createControls(drawFirstPicture, videoDom, loop) {
    const { id = "video", zIndex = 1000 } = this.configuration;
    const { width } = this._getWidthAndHeight();
    const controlsDom = document.createElement("div");
    const parentElement = document.getElementById(id);
    controlsDom.style.width = `${width}px`;
    controlsDom.style.height = "60px";
    controlsDom.style.position = "absolute";
    controlsDom.style.zIndex = zIndex + 10;
    controlsDom.style.bottom = "0";
    controlsDom.style.left = "0";
    controlsDom.style.backgroundColor = "rgba(0,0,0,0.4)";
    controlsDom.style.display = "block";
    const controlsButtonArea = document.createElement("div");
    controlsButtonArea.style.width = "100%";
    controlsButtonArea.style.height = "50%";
    controlsButtonArea.style.boxSizing = "border-box";
    controlsButtonArea.style.padding = "0 10px";
    controlsButtonArea.style.display = "flex";
    controlsButtonArea.style.alignItems = "center";
    controlsButtonArea.style.justifyContent = "space-between";
    controlsDom.appendChild(controlsButtonArea);
    const controlsSliderArea = document.createElement("div");
    controlsSliderArea.style.width = "100%";
    controlsSliderArea.style.height = "50%";
    controlsSliderArea.style.boxSizing = "border-box";
    controlsSliderArea.style.padding = "0 10px";
    controlsSliderArea.style.display = "flex";
    controlsSliderArea.style.alignItems = "center";
    controlsDom.appendChild(controlsSliderArea);
    const playAndTimeDom = this._createPlayAndTimeArea(videoDom, loop);
    const handleAreaDom = this._createHandleArea(drawFirstPicture, loop);
    controlsButtonArea.appendChild(playAndTimeDom);
    controlsButtonArea.appendChild(handleAreaDom);
    const sliderDom = this._createSlider();
    controlsSliderArea.appendChild(sliderDom);
    parentElement.appendChild(controlsDom);
  }
  draw() {
    const { line = 1, column = 1 } = this.configuration;
    this.maxPictureIndex = line * column - 1;
    this._setParentStyle();
    this._getWidthAndHeight();
    const canvasDom = this._createCanavas();
    const { drawFirstPicture, loop } = useCanavs(
      canvasDom,
      "bc-video",
      line,
      column
    );
    const videoDom = this._createVideoElement(drawFirstPicture);
    this._createControls(drawFirstPicture, videoDom, loop);
  }
}

export default bcPlayer;

/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-06-29 15:16:13
 * @LastEditors: weiyang
 * @LastEditTime: 2022-08-09 14:15:01
 */
import useCanavs from "./utils/drawCanvas.js";
import scale from "./utils/scale.js";
import { getHMS, isgy } from "./utils/util.js";
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
  #startX = 0;
  #startY = 0;
  #endX;
  #endY;
  speed = 1;
  speedList = [];
  audioIndex = 0;
  audioList = [];
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
  _resetCoordinates() {
    this.#startX = 0;
    this.#startY = 0;
    this.#endX = 0;
    this.#endY = 0;
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
      const audioDom = document.getElementById("bc-audio");
      dom[0].innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
      const scale1 = new scale(
        "bc-slider-btn",
        "bc-outBar",
        "bc-inline-slider",
        this.initVideo.videoLength,
        (e) => {
          video.currentTime = e;
          this.initVideo.currentTime = e;
          if (audioDom) {
            audioDom.currentTime = e;
            if (audioDom.paused && this.played) {
              audioDom.play();
            }
          }
          this.initVideo.formatCurrentTime = getHMS(e);
          dom[0].innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
        }
      );
    }
    function handleVideoTimeUpdate(e) {
      const dom = document.getElementsByClassName("bc-timer");
      const videoDom = document.getElementById("bc-video");
      const audioDom = document.getElementById("bc-audio");
      this.initVideo.currentTime = e.target.currentTime;
      this.initVideo.formatCurrentTime = getHMS(e.target.currentTime);
      dom[0].innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
      const outBarDom = document.getElementById("bc-outBar");
      const inlineBarDom = document.getElementById("bc-inline-slider");
      const btnDom = document.getElementById("bc-slider-btn");
      const x =
        (this.initVideo.currentTime / this.initVideo.videoLength) *
        outBarDom.getBoundingClientRect().width;
      const leftData = x - 12;
      inlineBarDom.style.width = Math.max(0, x) + "px";
      btnDom.style.left = leftData + "px";
      if (
        audioDom &&
        Math.abs(
          parseFloat(videoDom.currentTime) - parseFloat(audioDom.currentTime)
        ) > 0.5
      ) {
        audioDom.currentTime = videoDom.currentTime;
      }
      if (video.ended) {
        this.played = false;
        this.paused = true;
        const playDom = document.getElementById("bc-play");
        const pauseDom = document.getElementById("bc-pause");
        playDom.style.display = "block";
        pauseDom.style.display = "none";
        audioDom && audioDom.pause();
      }
    }
    video.addEventListener("canplay", setRealSizeAndFirstPicture.bind(this));
    video.addEventListener("loadedmetadata", setVideoTime.bind(this));
    video.addEventListener("timeupdate", handleVideoTimeUpdate.bind(this));
    video.id = "bc-video";
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
  // 创建裁剪选定层
  _createTailorCanvas(switchXy, switchWh, zoomLoop) {
    const { width, height } = this._getWidthAndHeight();
    const { zIndex = 1000, line = 1, column = 1 } = this.configuration;
    const videoDom = document.getElementById("bc-video");
    const tailorDom = document.createElement("canvas");
    tailorDom.width = width;
    tailorDom.height = height;
    tailorDom.style.position = "absolute";
    tailorDom.style.left = "0";
    tailorDom.style.top = "0";
    tailorDom.style.zIndex = `${zIndex + 2}`;
    tailorDom.id = "bc-shoot";
    tailorDom.style.display = "none";
    const divsor = isgy(
      this.#realVideoWidth / column,
      this.#realVideoHeight / line
    );
    const minW = this.#realVideoWidth / column / divsor;
    const minh = this.#realVideoHeight / line / divsor;
    const getXy = (e) => {
      this._resetCoordinates();
      this.#startX = e.offsetX;
      this.#startY = e.offsetY;
      this.#endX = undefined;
      tailorDom.onmousemove = (el) => {
        const ctx = tailorDom.getContext("2d");
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.strokeStyle = "#5e993e";
        ctx.clearRect(0, 0, width, height);
        ctx.fillRect(0, 0, width, height);
        this.#endX = el.offsetX;
        ctx.clearRect(
          this.#startX,
          this.#startY,
          this.#endX - this.#startX,
          parseInt(((this.#endX - this.#startX) / minW) * minh)
        );
        ctx.strokeRect(
          this.#startX,
          this.#startY,
          this.#endX - this.#startX,
          parseInt(((this.#endX - this.#startX) / minW) * minh)
        );
      };
    };
    const cancelXy = () => {
      const { id = "video" } = this.configuration;
      const parentElement = document.getElementById(id);
      tailorDom.onmousemove = null;
      const controlsDom = document.getElementById("bc-controls");
      const audioDom = document.getElementById("bc-audio");
      const { x, y } = switchXy(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight,
        this.#startX,
        this.#startY,
        width,
        height
      );
      const { w, h } = switchWh(
        this.#endX,
        this.#startX,
        width,
        height,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
      if ((!this.#endX && typeof this.#endX !== "number") || w === 0) {
        tailorDom.style.display = "none";
        this.isEnlarge = false;
        document.getElementById("bc-enlarge").style.display = "block";
        document.getElementById("bc-cancel-enlarge").style.display = "none";
        if (videoDom.paused) {
          const playDom = document.getElementById("bc-play");
          playDom.onclick();
        }
        this._resetCoordinates();
      } else {
        if (videoDom.paused) {
          const playDom = document.getElementById("bc-play");
          const pausedDom = document.getElementById("bc-pause");
          tailorDom.style.display = "none";
          playDom.style.display = "none";
          pausedDom.style.display = "block";
          videoDom.play();
          this.played = true;
          this.paused = false;
          audioDom && audioDom.play();
        }
        cancelAnimationFrame(this.#render);
        zoomLoop(x, y, w, h);
      }
      controlsDom.style.display = "block";
      parentElement.removeChild(tailorDom);
    };
    tailorDom.onmousedown = getXy;
    tailorDom.onmouseup = cancelXy;
    tailorDom.onmouseleave = cancelXy;
    return tailorDom;
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
    svgDom.setAttribute("viewBox", "0 0 24 24");
    svgDom.setAttribute("fill", "none");
    const g1 = document.createElementNS(SVG_NS, "g");
    g1.setAttribute("stroke", "none");
    g1.setAttribute("stroke-width", "1");
    g1.setAttribute("fill", "none");
    g1.setAttribute("fill-rule", "evenodd");
    const g2 = document.createElementNS(SVG_NS, "g");
    g2.setAttribute("transform", "translate(-729.000000, -704.000000)");
    g2.setAttribute("fill", "#FFFFFF");
    g2.setAttribute("fill-rule", "nonzero");
    const g3 = document.createElementNS(SVG_NS, "g");
    g3.setAttribute("transform", "translate(729.094166, 704.139868)");
    const g4 = document.createElementNS(SVG_NS, "g");
    g4.setAttribute("transform", "translate(5.366108, 3.000000)");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M2.26546324,0.272687916 C1.83145578,-0.0428130366 1.25712461,-0.0881088513 0.7790252,0.155456907 C0.300925788,0.399022665 0,0.890252508 0,1.42681874 L0,16.5746075 C0.000461593269,17.110917 0.301667915,17.6016564 0.779660465,17.8448668 C1.25765302,18.0880771 1.83166339,18.042662 2.26546324,17.7273117 L12.6797463,10.1534173 C13.0491776,9.88499345 13.2677843,9.45593828 13.2677843,8.99928649 C13.2677843,8.5426347 13.0491776,8.11357954 12.6797463,7.84515567 L2.26546324,0.272687916 Z"
    );
    g1.appendChild(g2);
    g2.appendChild(g3);
    g3.appendChild(g4);
    g4.appendChild(path);
    svgDom.appendChild(g1);
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
    svgDom.setAttribute("viewBox", "0 0 24 24");
    svgDom.setAttribute("fill", "none");
    const g1 = document.createElementNS(SVG_NS, "g");
    g1.setAttribute("stroke", "none");
    g1.setAttribute("stroke-width", "1");
    g1.setAttribute("fill", "none");
    g1.setAttribute("fill-rule", "evenodd");
    const g2 = document.createElementNS(SVG_NS, "g");
    g2.setAttribute("transform", "translate(-729.000000, -644.000000)");
    g2.setAttribute("fill", "#FFFFFF");
    g2.setAttribute("fill-rule", "nonzero");
    const g3 = document.createElementNS(SVG_NS, "g");
    g3.setAttribute("transform", "translate(729.094166, 644.139868)");
    const g4 = document.createElementNS(SVG_NS, "g");
    g4.setAttribute("transform", "translate(12.000000, 12.000000) scale(-1, 1) translate(-12.000000, -12.000000) translate(5.502409, 3.000000)");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M4.43739454,17.2513491 C4.43739454,17.6631111 4.10050561,18 3.68874366,18 L0.748650882,18 C0.336888937,18 0,17.6631111 0,17.2513491 L0,0.748650882 C0,0.336888937 0.336888937,0 0.748650882,0 L3.68874366,0 C4.10050561,0 4.43739454,0.336888937 4.43739454,0.748650882 L4.43739454,17.2513491 Z"
    );
    const path2 = document.createElementNS(SVG_NS, "path");
    path2.setAttribute(
      "d",
      "M12.9951816,17.2513491 C12.9951816,17.6631111 12.6582927,18 12.2465307,18 L9.30643793,18 C8.89467598,18 8.55778704,17.6631111 8.55778704,17.2513491 L8.55778704,0.748650882 C8.55778704,0.336888937 8.89467598,0 9.30643793,0 L12.2465307,0 C12.6582927,0 12.9951816,0.336888937 12.9951816,0.748650882 L12.9951816,17.2513491 Z"
    );
    g1.appendChild(g2);
    g2.appendChild(g3);
    g3.appendChild(g4);
    g4.appendChild(path);
    g4.appendChild(path2);
    svgDom.appendChild(g1);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "none";
    svgDom.id = "bc-pause";
    return svgDom;
  }
  // 添加播放按钮事件
  _addPlayEvent(
    playDom,
    pausedDom,
    videoDom,
    loop,
    zoomLoop,
    switchXy,
    switchWh,
    audioDom
  ) {
    playDom.onclick = () => {
      this.played = true;
      this.paused = false;
      playDom.style.display = "none";
      pausedDom.style.display = "block";
      videoDom.play();
      audioDom && audioDom.play();
      console.log(this.isEnlarge);
      if (this.isEnlarge) {
        const { width, height } = this._getWidthAndHeight();
        const { x, y } = switchXy(
          this.pictureIndex,
          this.#realVideoWidth,
          this.#realVideoHeight,
          this.#startX,
          this.#startY,
          width,
          height
        );
        const { w, h } = switchWh(
          this.#endX,
          this.#startX,
          width,
          height,
          this.#realVideoWidth,
          this.#realVideoHeight
        );
        console.log(x, y, w, h);
        this.#render = zoomLoop(x, y, w, h);
      } else {
        this.#render = loop(
          this.pictureIndex,
          this.#realVideoWidth,
          this.#realVideoHeight
        );
      }
    };
  }
  // 添加暂停按钮事件
  _addPauseEvent(
    playDom,
    pausedDom,
    videoDom,
    loop,
    zoomLoop,
    switchXy,
    switchWh,
    audioDom
  ) {
    pausedDom.onclick = () => {
      // this.#render && cancelAnimationFrame(this.#render);
      this.played = false;
      this.paused = true;
      playDom.style.display = "block";
      pausedDom.style.display = "none";
      videoDom.pause();
      audioDom && audioDom.pause();
      if (this.isEnlarge) {
        const { width, height } = this._getWidthAndHeight();
        const { x, y } = switchXy(
          this.pictureIndex,
          this.#realVideoWidth,
          this.#realVideoHeight,
          this.#startX,
          this.#startY,
          width,
          height
        );
        const { w, h } = switchWh(
          this.#endX,
          this.#startX,
          width,
          height,
          this.#realVideoWidth,
          this.#realVideoHeight
        );
        this.#render = zoomLoop(x, y, w, h);
      } else {
        this.#render = loop(
          this.pictureIndex,
          this.#realVideoWidth,
          this.#realVideoHeight
        );
      }
    };
  }
  // 创建时间
  _createTime() {
    const dom = document.createElement("span");
    dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
    dom.style.cssText = "font-size: 14px;font-family: MicrosoftYaHei;color: #FFFFFF;margin-left: 25px;"
    dom.className = "bc-timer";
    return dom;
  }
  _createPlayAndTimeArea(
    videoDom,
    loop,
    zoomLoop,
    switchXy,
    switchWh,
    audioDom,
    drawFirstPicture,
  ) {
    const { buttonList = ["switchPicture", "enlarge", "audio"], audioList } =
      this.configuration;
    const dom = document.createElement("div");
    let preDom,
      nextDom = "";
    dom.style.height = "100%";
    dom.style.display = "flex";
    dom.style.alignItems = "center";
    const playDom = this._createPlayButton();
    const pausedDom = this._createPausedButton();
    const timeDom = this._createTime();
    this._addPlayEvent(
      playDom,
      pausedDom,
      videoDom,
      loop,
      zoomLoop,
      switchXy,
      switchWh,
      audioDom
    );
    this._addPauseEvent(
      playDom,
      pausedDom,
      videoDom,
      loop,
      zoomLoop,
      switchXy,
      switchWh,
      audioDom
    );
    dom.appendChild(playDom);
    dom.appendChild(pausedDom);
    if (buttonList.includes("switchPicture")) {
      preDom = this._createPrePictureButton();
      nextDom = this._createNextPictureButton();
      this._addPreEvent(preDom, drawFirstPicture, drawFirstPicture);
      this._addNextEvent(nextDom, drawFirstPicture, loop);
      dom.appendChild(preDom);
      dom.appendChild(nextDom);
    }
    dom.appendChild(timeDom);
    return dom;
  }
  // 创建前一画面按钮
  _createPrePictureButton() {
    const dom = document.createElement("div");
    dom.style.cssText = "width: 72px;height: 32px;background: #ffffff;border-radius: 4px;display: flex; justify-content: center;align-items: center;font-size: 14px;color: #333333;margin-left: 20px;"
    dom.innerText = "前一画面"
    dom.style.cursor = "pointer";
    return dom;
  }
  // 创建后一画面按钮
  _createNextPictureButton() {
    const dom = document.createElement("div");
    dom.style.cssText = "width: 72px;height: 32px;background: #ffffff;border-radius: 4px;display: flex; justify-content: center;align-items: center;font-size: 14px;color: #333333;margin-left: 16px"
    dom.innerText = "后一画面"
    dom.style.cursor = "pointer";
    return dom;
  }
  // 添加前一画面按钮事件
  _addPreEvent(preDom, drawFirstPicture, loop) {
    preDom.onclick = () => {
      const enlargeDom = document.getElementById("bc-enlarge");
      const cancelEnlargeDom = document.getElementById("bc-cancel-enlarge");
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
      enlargeDom.style.display = "flex";
      cancelEnlargeDom.style.display = "none";
      this.isEnlarge = false;
    };
  }
  // 添加后一画面按钮事件
  _addNextEvent(nextDom, drawFirstPicture, loop) {
    nextDom.onclick = () => {
      const enlargeDom = document.getElementById("bc-enlarge");
      const cancelEnlargeDom = document.getElementById("bc-cancel-enlarge");
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
      enlargeDom.style.display = "flex";
      cancelEnlargeDom.style.display = "none";
      this.isEnlarge = false;
    };
  }
  // 创建局部放大按钮
  _createEnlargeButton() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svgDom = document.createElementNS(SVG_NS, "svg");
    svgDom.setAttribute("width", "16");
    svgDom.setAttribute("height", "16");
    svgDom.setAttribute("viewBox", "0 0 16 16");
    svgDom.setAttribute("fill", "none");
    const g1 = document.createElementNS(SVG_NS, "g");
    g1.setAttribute("stroke", "none");
    g1.setAttribute("stroke-width", "1");
    g1.setAttribute("fill", "none");
    g1.setAttribute("fill-rule", "evenodd");
    const g2 = document.createElementNS(SVG_NS, "g");
    g2.setAttribute("transform", "translate(-1670.000000, -705.000000)");
    g2.setAttribute("fill", "#FFFFFF");
    g2.setAttribute("fill-rule", "nonzero");
    const g3 = document.createElementNS(SVG_NS, "g");
    g3.setAttribute("transform", "translate(1670.284615, 705.139868)");
    const g4 = document.createElementNS(SVG_NS, "g");
    g4.setAttribute("transform", "translate(0.000000, 0.068723)");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M6.80542987,8.43249565 L6.97250261,8.59956839 C7.01705534,8.64412112 7.06160807,8.68588931 7.1061608,8.72487295 C7.15071353,8.76385659 7.19526627,8.80562477 7.239819,8.8501775 L7.44030629,9.05066479 C7.66306995,9.27342846 7.75217542,9.46834666 7.70762269,9.6354194 C7.66306996,9.80249214 7.52384267,9.99741035 7.28994082,10.220174 C7.18969717,10.3315558 7.02540897,10.5014131 6.79707622,10.7297459 C6.56874346,10.9580786 6.32370344,11.2059032 6.06195614,11.4732196 C5.80020885,11.740536 5.54681518,11.9967142 5.30177514,12.2417542 C5.0567351,12.4867943 4.86738598,12.6817125 4.7337278,12.8265088 C4.5332405,13.0269961 4.39401321,13.2024225 4.31604593,13.352788 C4.23807866,13.5031535 4.2714932,13.6507344 4.41628958,13.7955308 C4.51653322,13.8957744 4.64462233,14.0294326 4.8005569,14.1965054 C4.95649147,14.3635781 5.09014967,14.5028054 5.20153149,14.6141872 C5.39088061,14.8035364 5.46049425,14.9706091 5.41037242,15.1154055 C5.36025059,15.2602019 5.19596239,15.3437382 4.91750782,15.3660146 C4.62791506,15.3994291 4.30490775,15.4384128 3.94848589,15.4829655 C3.59206403,15.5275182 3.22450399,15.5692864 2.84580577,15.6082701 C2.46710754,15.6472537 2.09676296,15.6890219 1.73477201,15.7335746 C1.37278106,15.7781274 1.04142011,15.817111 0.740689167,15.8505255 C0.451096406,15.8839401 0.250609111,15.847741 0.139227284,15.7419283 C0.0278454568,15.6361155 -0.0167072741,15.449551 0.00556909136,15.1822346 C0.0278454568,14.90378 0.0584754593,14.5919109 0.0974590988,14.2466272 C0.136442738,13.9013435 0.178210923,13.5477062 0.222763654,13.1857152 C0.267316385,12.8237243 0.30908457,12.4645179 0.34806821,12.108096 C0.387051849,11.7516742 0.423250943,11.4230978 0.456665491,11.1223668 C0.49008004,10.7993595 0.581970053,10.5933031 0.73233553,10.5041977 C0.882701008,10.4150922 1.0525583,10.465214 1.24190741,10.6545631 C1.35328923,10.765945 1.49808561,10.9023877 1.67629655,11.0638914 C1.85450748,11.225395 2.00487295,11.3674069 2.12739296,11.4899269 C2.24991297,11.6124469 2.3668639,11.6514305 2.47824574,11.6068778 C2.58962758,11.5623251 2.71771668,11.4732196 2.86251306,11.3395614 C3.00730943,11.194765 3.20501218,10.9942777 3.4556213,10.7380995 C3.70623043,10.4819213 3.96797773,10.2173894 4.24086322,9.94450396 C4.51374871,9.67161847 4.77828056,9.40430207 5.03445877,9.14255477 C5.29063698,8.88080746 5.49669337,8.67196653 5.65262793,8.51603197 C5.71945702,8.44920288 5.79463976,8.38515833 5.87817613,8.32389832 C5.9617125,8.26263832 6.05360251,8.22087013 6.15384617,8.19859377 C6.25408982,8.1763174 6.35711802,8.18188649 6.46293075,8.21530104 C6.56874349,8.24871559 6.68290987,8.32111377 6.80542989,8.4324956 L6.80542987,8.43249565 Z M15.2593108,0.0120292373 C15.5489036,-0.0213853108 15.7493909,0.014813783 15.8607727,0.120626519 C15.9721545,0.226439255 16.0167073,0.413003821 15.9944309,0.680320217 C15.9721545,0.958774796 15.9415245,1.27064392 15.9025409,1.6159276 C15.8635573,1.96121127 15.8217891,2.31484859 15.7772363,2.67683953 C15.7326836,3.03883048 15.6909154,3.40082143 15.6519318,3.76281238 C15.6129482,4.12480333 15.5767491,4.45616428 15.5433345,4.75689522 C15.50992,5.07990253 15.4180299,5.28317437 15.2676645,5.36671074 C15.117299,5.45024711 14.9474417,5.39734075 14.7580926,5.20799164 C14.6467108,5.09660981 14.4935607,4.95181343 14.2986425,4.7736025 C14.1037243,4.59539156 13.9450052,4.44502609 13.8224852,4.32250608 C13.6999652,4.19998607 13.5941525,4.1470797 13.505047,4.16378698 C13.4159415,4.18049425 13.3045597,4.25567698 13.1709015,4.38933518 C13.0149669,4.54526973 12.8116951,4.75132612 12.561086,5.00750433 C12.3104768,5.26368255 12.045945,5.53378349 11.7674904,5.81780716 C11.4890358,6.10183083 11.2161504,6.37750086 10.948834,6.64481726 L10.3306648,7.26298642 C10.2638357,7.32981551 10.1914375,7.39664461 10.1134702,7.46347371 C10.035503,7.5303028 9.94918204,7.58042462 9.85450747,7.61383917 C9.75983291,7.64725372 9.65958926,7.65282281 9.55377652,7.63054645 C9.44796379,7.60827008 9.3393665,7.53587189 9.22798466,7.41335188 L8.59310823,6.77847545 C8.37034456,6.55571179 8.27288546,6.35243995 8.30073092,6.16865993 C8.32857637,5.98487992 8.45388093,5.78160808 8.6766446,5.55884441 C8.77688824,5.45860077 8.94396099,5.28874348 9.17786284,5.04927254 C9.41176469,4.8098016 9.6623738,4.55640793 9.92969019,4.28909153 C10.1970066,4.02177514 10.4559693,3.76002783 10.7065785,3.50384962 C10.9571876,3.2476714 11.1548903,3.0527532 11.2996867,2.91909501 C11.500174,2.71860771 11.6254786,2.55431951 11.6756004,2.42623041 C11.7257222,2.29814131 11.6783849,2.16169856 11.5335886,2.01690218 C11.4333449,1.91665853 11.3136095,1.79413852 11.1743822,1.64934213 C11.0351549,1.50454574 10.9098503,1.37645664 10.7984685,1.26507481 C10.6091194,1.07572569 10.5395057,0.908652946 10.5896275,0.763856571 C10.6397494,0.619060195 10.8040376,0.529954728 11.0824921,0.496540169 C11.3609467,0.46312561 11.6811695,0.424141971 12.0431604,0.379589251 C12.4051514,0.335036531 12.775496,0.293268346 13.1541942,0.254284695 C13.5328924,0.215301045 13.903237,0.173532859 14.265228,0.128980139 C14.6272189,0.0844274195 14.9585799,0.04544378 15.2593108,0.0120292209 L15.2593108,0.0120292373 Z"
    );
    g1.appendChild(g2);
    g2.appendChild(g3);
    g3.appendChild(g4);
    g4.appendChild(path);
    svgDom.appendChild(g1);
    svgDom.id = "bc-enlarge";
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
    svgDom.setAttribute("viewBox", "0 0 24 24");
    svgDom.setAttribute("fill", "none");
    const g1 = document.createElementNS(SVG_NS, "g");
    g1.setAttribute("stroke", "none");
    g1.setAttribute("stroke-width", "1");
    g1.setAttribute("fill", "none");
    g1.setAttribute("fill-rule", "evenodd");
    const g2 = document.createElementNS(SVG_NS, "g");
    g2.setAttribute("transform", "translate(-1670.000000, -634.000000)");
    g2.setAttribute("fill", "#FFFFFF");
    g2.setAttribute("fill-rule", "nonzero");
    const g3 = document.createElementNS(SVG_NS, "g");
    g3.setAttribute("transform", "translate(1670.272495, 634.124258)");
    const g4 = document.createElementNS(SVG_NS, "g");
    g4.setAttribute("transform", "translate(0.107644, 0.259547)");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M6.7119041,8.21368162 C6.97553867,8.18438889 7.1610593,8.22344587 7.26846598,8.33085255 C7.37587265,8.43825923 7.41981175,8.61889773 7.40028326,8.87276805 C7.38075477,9.13640263 7.35146204,9.43421205 7.31240507,9.76619633 C7.27334809,10.0981806 7.23185006,10.4374881 7.18791097,10.7841187 C7.14397188,11.1307493 7.10247384,11.4749389 7.06341687,11.8166874 C7.02435989,12.158436 6.99018504,12.4757739 6.96089231,12.7687012 C6.93159959,13.081157 6.84372139,13.2788829 6.69725774,13.361879 C6.55079408,13.4448751 6.38968407,13.3936128 6.21392768,13.2080921 C6.10652101,13.1006855 5.9698216,12.9688682 5.80382947,12.8126403 C5.63783733,12.6564124 5.4962558,12.5245951 5.37908488,12.4171884 C5.25214971,12.2902533 5.13497879,12.2463142 5.02757211,12.2853711 C4.92016543,12.3244281 4.79811239,12.4123063 4.66141298,12.5490057 C4.51494932,12.6954694 4.32210552,12.8907542 4.08288156,13.1348603 C3.8436576,13.3789664 3.59466939,13.6328367 3.33591693,13.8964713 C3.07716447,14.1601059 2.8257352,14.4164173 2.58162913,14.6654055 C2.33752305,14.9143937 2.13735606,15.1121196 1.98112816,15.2585833 C1.9225427,15.326933 1.85175193,15.3904006 1.76875586,15.448986 C1.6857598,15.5075715 1.59788161,15.5490695 1.50512129,15.5734801 C1.41236098,15.5978907 1.31471854,15.5954497 1.21219399,15.5661569 C1.10966943,15.5368642 0.999821692,15.4636324 0.882650764,15.3464615 C0.814301061,15.2781118 0.758156659,15.2244084 0.714217558,15.1853514 C0.670278458,15.1462945 0.628780425,15.1072375 0.589723459,15.0681805 L0.457906172,14.9363632 L0.267503422,14.7459605 C0.0526900641,14.5311471 -0.0327470645,14.3456265 0.011192036,14.1893986 C0.0551311366,14.0331707 0.184507361,13.842768 0.399320708,13.6181904 C0.496963138,13.5205479 0.658073157,13.361879 0.882650764,13.1421835 C1.10722837,12.922488 1.34401127,12.6857051 1.59299947,12.4318348 C1.84198767,12.1779645 2.0836527,11.9314173 2.31799456,11.6921933 C2.55233641,11.4529694 2.73785704,11.2650077 2.87455643,11.1283083 C3.0698413,10.9330234 3.20165859,10.7645902 3.27000829,10.6230087 C3.338358,10.4814271 3.30418314,10.3422867 3.16748374,10.2055873 C3.06984131,10.1079448 2.94778827,9.97856862 2.80132461,9.8174586 C2.65486096,9.65634858 2.52792579,9.52209024 2.42051911,9.41468356 C2.24476273,9.23892718 2.17885408,9.08025822 2.22279317,8.93867669 C2.26673226,8.79709516 2.42540122,8.71165803 2.69880004,8.6823653 C2.97219886,8.65307258 3.27977253,8.61645666 3.62152105,8.57251756 C3.96326956,8.52857846 4.31478232,8.48708043 4.67605934,8.44802346 C5.03733635,8.4089665 5.39373124,8.36746846 5.745244,8.32352936 C6.09675677,8.27959026 6.4189768,8.24297435 6.7119041,8.21368162 L6.7119041,8.21368162 Z M15.4411377,0.817267209 C15.6559511,1.03208057 15.7511525,1.22492437 15.7267419,1.39579863 C15.7023313,1.56667289 15.5778371,1.76439882 15.3532596,1.98897643 C15.2458529,2.09638311 15.0823018,2.26237524 14.8626063,2.48695284 C14.6429109,2.71153044 14.4036869,2.95319547 14.1449344,3.21194792 C13.886182,3.47070038 13.6371938,3.72212965 13.3979698,3.96623572 C13.1587458,4.2103418 12.9707842,4.40074454 12.8340847,4.53744396 C12.6387999,4.73272883 12.5191879,4.88895672 12.4752488,5.00612764 C12.4313097,5.12329856 12.4776899,5.25023373 12.6143893,5.38693314 C12.7120317,5.48457557 12.8267616,5.60418755 12.9585789,5.74576908 C13.0903961,5.88735061 13.2100081,6.01184472 13.3174148,6.1192514 C13.4931712,6.29500778 13.5566388,6.45367674 13.5078175,6.59525827 C13.4589963,6.7368398 13.3027684,6.82227692 13.0391339,6.85156965 C12.765735,6.88086238 12.4581614,6.91747829 12.1164129,6.96141739 C11.7746643,7.00535649 11.4207105,7.04685453 11.0545514,7.08591149 C10.6883923,7.12496846 10.3295563,7.16646649 9.97804354,7.21040559 C9.62653078,7.25434469 9.30919287,7.29096061 9.0260298,7.32025333 C8.51828915,7.3788388 8.28394731,7.16402544 8.32300428,6.67581326 C8.35229701,6.41217869 8.3840308,6.11436926 8.41820565,5.78238499 C8.4523805,5.45040071 8.49143748,5.10865219 8.53537658,4.75713943 C8.57931568,4.40562666 8.62081371,4.05899602 8.65987068,3.71724749 C8.69892764,3.37549897 8.73310249,3.05816106 8.76239523,2.76523376 C8.79168796,2.45277797 8.87956615,2.25505204 9.0260298,2.17205596 C9.17249346,2.08905988 9.3384856,2.14032216 9.52400622,2.32584279 C9.57282743,2.38442826 9.63629502,2.4503369 9.71440897,2.52356873 C9.79252292,2.59680056 9.87307793,2.67247344 9.956074,2.75058738 C10.0390701,2.82870133 10.1196251,2.90437421 10.197739,2.97760604 C10.275853,3.05083787 10.3442027,3.11674651 10.4027881,3.17533198 C10.5297233,3.30226714 10.6322479,3.35841154 10.7103618,3.34376518 C10.7884757,3.32911882 10.8958824,3.25344593 11.0325818,3.11674653 C11.1790455,2.97028287 11.3743304,2.77255694 11.6184364,2.52356873 C11.8625425,2.27458052 12.1188539,2.01582807 12.3873706,1.74731137 C12.6558873,1.47879467 12.9146398,1.21760116 13.163628,0.963730838 C13.4126162,0.709860514 13.6152242,0.504811401 13.7714521,0.348583497 C13.8300376,0.289998033 13.8983873,0.228971511 13.9765012,0.165503933 C14.0546152,0.102036355 14.1376113,0.0556561968 14.2254895,0.0263634597 C14.3133677,-0.00292927736 14.406128,-0.00781139683 14.5037704,0.0117171013 C14.6014128,0.0312455995 14.7088195,0.0995953024 14.8259904,0.21676621 C14.8943401,0.285115913 14.9504845,0.338819253 14.9944236,0.377876229 C15.0383627,0.416933205 15.0798608,0.455990181 15.1189177,0.495047157 L15.250735,0.626864443 L15.4411377,0.817267209 Z"
    );
    g1.appendChild(g2);
    g2.appendChild(g3);
    g3.appendChild(g4);
    g4.appendChild(path);
    svgDom.appendChild(g1);
    this._addButtonSpacing(svgDom);
    svgDom.id = "bc-cancel-enlarge";
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "none";
    return svgDom;
  }
  // 添加局部放大按钮事件
  _addEnlargeEvent(enlargeDom, cancelEnlargeDom, switchXy, switchWh, zoomLoop) {
    enlargeDom.onclick = () => {
      const { width, height } = this._getWidthAndHeight();
      const { id = "video" } = this.configuration;
      const parentElement = document.getElementById(id);
      const controlsDom = document.getElementById("bc-controls");
      const tailorDom = this._createTailorCanvas(switchXy, switchWh, zoomLoop);
      parentElement.appendChild(tailorDom);
      this.isEnlarge = true;
      enlargeDom.style.display = "none";
      cancelEnlargeDom.style.display = "block";
      tailorDom.style.display = "block";
      const ctx = tailorDom.getContext("2d");
      ctx.fillStyle = "rgba(0, 0, 0, .4)";
      ctx.fillRect(0, 0, width, height);
      const pausedDom = document.getElementById("bc-pause");
      // this._resetCoordinates();
      pausedDom.onclick();
      controlsDom.style.display = "none";
    };
  }
  // 添加取消局部放大按钮事件
  _addCancelEnlargeEvent(enlargeDom, cancelEnlargeDom, loop) {
    cancelEnlargeDom.onclick = () => {
      // const {id = "video"} = this.configuration
      // const tailorDom = document.getElementById("bc-shoot");
      this.isEnlarge = false;
      enlargeDom.style.display = "block";
      cancelEnlargeDom.style.display = "none";
      // tailorDom.style.display = "none";
      // tailorDom.onmousemove = null;
      cancelAnimationFrame(this.#render);
      this.#render = loop(
        this.pictureIndex,
        this.#realVideoWidth,
        this.#realVideoHeight
      );
    };
  }
  // 创建倍速按钮
  _createSpeedButton() {
    const dom = document.createElement("div");
    dom.style.cssText =
      "width: 58px; height: 32px; border-radius: 4px;  cursor: pointer;background: #ffffff;color: #ffffff; box-sizing: border-box;font-size: 12px; display:flex;justify-content:center;align-items:center;font-size: 14px;color: #333333;margin-left: 16px;";
    dom.innerText = "1X";
    dom.id = "bc-speed";
    return dom;
  }
  // 添加倍速按钮事件
  _addSpeedEvent(dom, videoDom) {
    const { speed = [0.5, 1, 1.5, 2] } = this.configuration;
    this.speedList = speed;
    const audioDom = document.getElementById("bc-audio");
    dom.onclick = () => {
      const tempSpeed = Number(dom.innerText.split("X")[0]);
      const tempIndex = this.speedList.findIndex((item) => item === tempSpeed);
      this.speed =
        tempIndex === this.speedList.length - 1
          ? this.speedList[0]
          : this.speedList[tempIndex + 1];
      videoDom.playbackRate = String(this.speed);
      if (audioDom) {
        audioDom.playbackRate = String(this.speed);
      }
      dom.innerText = `${this.speed}X`;
    };
  }
  _createAudioButton() {
    const dom = document.createElement("div");
    dom.style.cssText =
      "width: 56px; height: 32px; border-radius: 4px; cursor: pointer;background: #ffffff; box-sizing: border-box;font-size: 14px;color: #333333; display:flex;justify-content:center;align-items:center;margin-left: 32px;";
    dom.innerText = "音频1";
    dom.id = "bc-audio-button";
    return dom;
  }
  _addAudioEvent(audioButtonDom, audioDom) {
    const { audioList } = this.configuration;
    this.audioList = audioList;
    audioDom.src = this.audioList[0];
    audioButtonDom.onclick = () => {
      console.log(this.played);
      this.audioIndex =
        this.audioIndex === this.audioList.length - 1 ? 0 : this.audioIndex + 1;
      audioDom.src = this.audioList[this.audioIndex];
      audioDom.currentTime = this.initVideo.currentTime;
      audioButtonDom.innerText = `音频${this.audioIndex + 1}`;
      if (this.played) {
        audioDom.play();
      } else {
        audioDom.pause();
      }
    };
  }
  _createAudioDom() {
    const { id = "video" } = this.configuration;
    const parentElement = document.getElementById(id);
    const dom = document.createElement("audio");
    dom.src = "";
    dom.id = "bc-audio";
    parentElement.appendChild(dom);
    return dom;
  }
  // 创建业务操作区域
  _createHandleArea(
    drawFirstPicture,
    loop,
    switchXy,
    switchWh,
    zoomLoop,
    videoDom,
    audioDom
  ) {
    const { buttonList = ["switchPicture", "enlarge", "audio"], audioList } =
      this.configuration;
    const handleAreaDom = document.createElement("div");
    handleAreaDom.style.height = "100%";
    handleAreaDom.style.display = "flex";
    handleAreaDom.style.alignItems = "center";
    let enlargeDom,
      cancelEnlargeDom,
      audioButtonDom = "";
    if (buttonList.includes("enlarge")) {
      enlargeDom = this._createEnlargeButton();
      cancelEnlargeDom = this._createCancelEnlargeButton();
      this._addEnlargeEvent(
        enlargeDom,
        cancelEnlargeDom,
        switchXy,
        switchWh,
        zoomLoop
      );
      this._addCancelEnlargeEvent(enlargeDom, cancelEnlargeDom, loop);
      handleAreaDom.appendChild(enlargeDom);
      handleAreaDom.appendChild(cancelEnlargeDom);
    }
    if (buttonList.includes("audio") && audioList && audioList.length > 0) {
      audioButtonDom = this._createAudioButton();
      this._addAudioEvent(audioButtonDom, audioDom);
      handleAreaDom.appendChild(audioButtonDom);
    }
    const speedDom = this._createSpeedButton();
    this._addSpeedEvent(speedDom, videoDom);
    handleAreaDom.appendChild(speedDom);
    return handleAreaDom;
  }
  // 创建进度条
  _createSlider() {
    const outBarDom = document.createElement("div");
    outBarDom.style.width = "100%";
    outBarDom.style.height = "6px";
    outBarDom.style.backgroundColor = "rgba(255,255,255,0.3)";
    outBarDom.style.borderRadius = "6px";
    outBarDom.style.position = "relative";
    outBarDom.id = "bc-outBar";
    const inlineBarDom = document.createElement("div");
    inlineBarDom.id = "bc-inline-slider";
    inlineBarDom.style.cssText = "width: 0;height: 6px;border-radius: 6px;position: absolute; left: 0; bottom: 0;z-index: 1;background: #1890FF;max-width: 100%"
    outBarDom.appendChild(inlineBarDom);
    const btnDom = document.createElement("div");
    btnDom.style.cssText = "width: 32px;height: 32px;background: rgba(255,255,255,0.69);border-radius: 100%;display: flex; justify-content: center;align-items: center;"
    const btnChildDom = document.createElement("div");
    btnChildDom.style.cssText = "width: 16px;height: 16px;border-radius: 100%;background: #1890ff";
    btnDom.appendChild(btnChildDom);
    btnDom.style.position = "absolute";
    btnDom.style.top = "-12px";
    btnDom.style.left = "-12px";
    btnDom.style.zIndex = "2";
    btnDom.style.cursor = "pointer";
    btnDom.id = "bc-slider-btn";
    outBarDom.appendChild(btnDom);
    return outBarDom;
  }
  _addBtnEvent(dom) {}
  // 创建控制条
  _createControls(
    drawFirstPicture,
    videoDom,
    loop,
    switchXy,
    switchWh,
    zoomLoop,
    audioDom
  ) {
    const { id = "video", zIndex = 1000 } = this.configuration;
    const { width } = this._getWidthAndHeight();
    const controlsDom = document.createElement("div");
    const parentElement = document.getElementById(id);
    controlsDom.style.width = `${width}px`;
    controlsDom.style.position = "absolute";
    controlsDom.style.zIndex = zIndex + 10;
    controlsDom.style.bottom = "0";
    controlsDom.style.left = "0";
    controlsDom.style.background = "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6))";
    controlsDom.style.display = "block";
    const controlsSliderArea = document.createElement("div");
    controlsSliderArea.style.width = "100%";
    controlsSliderArea.style.boxSizing = "border-box";
    controlsSliderArea.style.padding = "0 12px";
    controlsSliderArea.style.display = "flex";
    controlsSliderArea.style.alignItems = "center";
    controlsSliderArea.style.margin = "18px 0";
    controlsDom.appendChild(controlsSliderArea);
    const controlsButtonArea = document.createElement("div");
    controlsButtonArea.style.width = "100%";
    controlsButtonArea.style.boxSizing = "border-box";
    controlsButtonArea.style.padding = "0 12px";
    controlsButtonArea.style.display = "flex";
    controlsButtonArea.style.alignItems = "center";
    controlsButtonArea.style.justifyContent = "space-between";
    controlsButtonArea.style.margin = "0 0 18px 0"
    controlsDom.appendChild(controlsButtonArea);
    const playAndTimeDom = this._createPlayAndTimeArea(
      videoDom,
      loop,
      zoomLoop,
      switchXy,
      switchWh,
      audioDom,
      drawFirstPicture
    );
    const handleAreaDom = this._createHandleArea(
      drawFirstPicture,
      loop,
      switchXy,
      switchWh,
      zoomLoop,
      videoDom,
      audioDom
    );
    controlsButtonArea.appendChild(playAndTimeDom);
    controlsButtonArea.appendChild(handleAreaDom);
    const sliderDom = this._createSlider();
    controlsSliderArea.appendChild(sliderDom);
    controlsDom.id = "bc-controls";
    parentElement.appendChild(controlsDom);
  }
  destroy() {
    const videoDom = document.getElementById("bc-video");
    const audioDom = document.getElementById("bc-audio");
    videoDom && videoDom.pause();
    audioDom && audioDom.pause();
    const { id } = this.configuration;
    const parentElement = document.getElementById(id);
    var childs = parentElement.childNodes;
    setTimeout(() => {
      for (var i = childs.length - 1; i >= 0; i--) {
        parentElement.removeChild(childs[i]);
      }
    }, 50);
  }
  draw() {
    const {
      line = 1,
      column = 1,
      audioList,
      buttonList = ["switchPicture", "enlarge", "audio"],
    } = this.configuration;
    this.maxPictureIndex = line * column - 1;
    this._setParentStyle();
    this._getWidthAndHeight();
    const canvasDom = this._createCanavas();
    const { drawFirstPicture, loop, switchXy, switchWh, zoomLoop } = useCanavs(
      canvasDom,
      "bc-video",
      line,
      column
    );
    const videoDom = this._createVideoElement(drawFirstPicture);
    if (audioList && audioList.length > 0 && buttonList.includes("audio")) {
      const audioDom = this._createAudioDom();
      this._createControls(
        drawFirstPicture,
        videoDom,
        loop,
        switchXy,
        switchWh,
        zoomLoop,
        audioDom
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
  }
}

export default bcPlayer;

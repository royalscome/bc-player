/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-06-29 15:16:13
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-06 19:41:28
 */
import useCanavs from "./utils/drawCanvas.js";
class bcPlayer {
  // 视频源真实宽高
  #realVideoWidth = 0;
  #realVideoHeight = 0;
  // 当前选中画面
  pictureIndex = 0;
  maxPictureIndex = 0;
  played = false;
  paused = true;
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
    audioList.length > 1 && (video.muted = true);
    video.autoplay = false;
    video.src = url;
    video.id = "bc-video";
    video.style.width = "0";
    video.style.height = "0";
    const setRealSizeAndFirstPicture = (e) => {
      this.#realVideoWidth = e.target.videoWidth;
      this.#realVideoHeight = e.target.videoHeight;
      setTimeout(() => {
        drawFirstPicture(0, this.#realVideoWidth, this.#realVideoHeight);
      }, 500);
    };
    video.addEventListener("canplay", setRealSizeAndFirstPicture);
    const parentElement = document.getElementById(id);
    parentElement.appendChild(video);
    return video;
  }
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
    return svgDom;
  }
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
    return svgDom;
  }
  _addPlayEvent(playDom, pausedDom) {
    playDom.onclick = () => {
      this.played = true;
      this.paused = false;
      playDom.style.display = "none";
      pausedDom.style.display = "block";
    };
  }
  _addPauseEvent(playDom, pausedDom) {
    pausedDom.onclick = () => {
      this.played = false;
      this.paused = true;
      playDom.style.display = "block";
      pausedDom.style.display = "none";
    };
  }
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
    path.setAttribute("stroke-linecap", "round");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "block";
    return svgDom;
  }
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
    path.setAttribute("stroke-linecap", "round");
    path2.setAttribute("stroke-linejoin", "round");
    svgDom.appendChild(path2);
    svgDom.style.cursor = "pointer";
    svgDom.style.display = "block";
    return svgDom;
  }
  _addPreEvent(preDom, drawFirstPicture) {
    const pictureIndex = this.pictureIndex;
    preDom.onclick = () => {
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
    };
  }
  _addNextEvent(nextDom, drawFirstPicture) {
    nextDom.onclick = () => {
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
    };
  }
  _createHandleArea(drawFirstPicture) {
    const handleAreaDom = document.createElement("div");
    handleAreaDom.style.height = "100%";
    handleAreaDom.style.display = "flex";
    handleAreaDom.style.alignItems = "center";
    const preDom = this._createPrePictureButton();
    const nextDom = this._createNextPictureButton();
    this._addPreEvent(preDom, drawFirstPicture);
    this._addNextEvent(nextDom, drawFirstPicture);
    handleAreaDom.appendChild(preDom);
    handleAreaDom.appendChild(nextDom);
    return handleAreaDom;
  }
  _createControls(drawFirstPicture) {
    const { id = "video", zIndex = 1000 } = this.configuration;
    const { width } = this._getWidthAndHeight();
    const controlsDom = document.createElement("div");
    const parentElement = document.getElementById(id);
    controlsDom.style.width = `${width}px`;
    controlsDom.style.height = "60px";
    controlsDom.style.position = "absolute";
    controlsDom.style.zIndex = zIndex + 2;
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
    controlsDom.appendChild(controlsSliderArea);
    const playDom = this._createPlayButton();
    const pausedDom = this._createPausedButton();
    const handleAreaDom = this._createHandleArea(drawFirstPicture);
    controlsButtonArea.appendChild(playDom);
    controlsButtonArea.appendChild(pausedDom);
    controlsButtonArea.appendChild(handleAreaDom);
    this._addPlayEvent(playDom, pausedDom);
    this._addPauseEvent(playDom, pausedDom);
    parentElement.appendChild(controlsDom);
  }
  draw() {
    const { line = 1, column = 1 } = this.configuration;
    this.maxPictureIndex = line * column - 1;
    this._setParentStyle();
    this._getWidthAndHeight();
    const canvasDom = this._createCanavas();
    const { drawFirstPicture } = useCanavs(canvasDom, "bc-video", line, column);
    this._createVideoElement(drawFirstPicture);
    this._createControls(drawFirstPicture);
  }
}

export default bcPlayer;

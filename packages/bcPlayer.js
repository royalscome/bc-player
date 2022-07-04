import useCanavs from "./utils/drawCanvas.js";
class bcPlayer {
  // 视频源真实宽高
  #realVideoWidth = 0;
  #realVideoHeight = 0;
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
    const { url, audioList = [] } = this.configuration;
    const video = document.createElement("video");
    audioList.length > 1 && (video.muted = true);
    video.autoplay = false;
    video.src = url;
    video.id = "bc-video";
    function setRealSizeAndFirstPicture(e) {
      this.realVideoWidth = e.target.videoWidth;
      this.realVideoHeight = e.target.videoHeight;
      drawFirstPicture(this.realVideoWidth, this.realVideoHeight);
    }
    video.addEventListener("canplay", setRealSizeAndFirstPicture);
    return video;
  }
  _createCanavas() {
    const { id = "video" } = this.configuration;
    const { width, height } = this._getWidthAndHeight();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const parentElement = document.getElementById(id);
    parentElement.appendChild(canvas);
    return canvas;
  }
  draw() {
    const { line = 1, column = 1 } = this.configuration;
    this._setParentStyle();
    this._getWidthAndHeight();
    const canvasDom = this._createCanavas();
    const { drawFirstPicture } = useCanavs(canvasDom, "bc-video", line, column);
    this._createVideoElement(drawFirstPicture);
  }
}

export default bcPlayer;

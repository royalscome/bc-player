import { isgy, getElement } from "../utils/util.js";
import {
  createPlayButtonSvg,
  createPausedButtonSvg,
  createEnlargeButtonSvg,
  createCancelEnlargeButtonSvg,
} from "../icons.js";

export const controlsMethods = {
  // ─── Canvas 层 ────────────────────────────────────────────────
  _createCanavas() {
    const { id = "video", zIndex = 1000 } = this.configuration;
    const { width, height } = this._getWidthAndHeight();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.id = "bc-canvas";
    canvas.setAttribute("canvas-tag", this.tag);
    canvas.style.cssText = `position:absolute;z-index:${zIndex + 1};top:0;left:0;`;
    const parentElement = document.getElementById(id);
    parentElement.appendChild(canvas);

    const div = document.createElement("div");
    div.setAttribute(
      "style",
      `width:${width}px;height:${height}px;position:absolute;z-index:${
        zIndex + 3
      };top:0;left:0;font-size:12px;box-sizing:border-box;color:#fff;padding:10px;user-select:none;letter-spacing:2px;`
    );
    div.setAttribute("text-tag", this.tag);
    div.innerText = `画面${this.pictureIndex + 1}`;
    parentElement.appendChild(div);
    return canvas;
  },

  modifyText() {
    getElement("text-tag", this.tag).innerText = `画面${this.pictureIndex + 1}`;
  },

  // ─── 裁剪选区层 ───────────────────────────────────────────────
  _createTailorCanvas(switchXy, switchWh, zoomLoop, videoDom) {
    const { width, height } = this._getWidthAndHeight();
    const { zIndex = 1000, line = 1, column = 1 } = this.configuration;
    const tailorDom = document.createElement("canvas");
    tailorDom.width = width;
    tailorDom.height = height;
    tailorDom.style.cssText = `position:absolute;left:0;top:0;z-index:${zIndex + 5};display:none;`;
    tailorDom.id = "bc-shoot";
    tailorDom.setAttribute("shoot-tag", this.tag);

    const divsor = isgy(this._realVideoWidth / column, this._realVideoHeight / line);
    const minW = this._realVideoWidth / column / divsor;
    const minh = this._realVideoHeight / line / divsor;

    const getXy = (e) => {
      this._resetCoordinates();
      this._startX = e.offsetX;
      this._startY = e.offsetY;
      this._endX = undefined;
      tailorDom.onmousemove = (el) => {
        const ctx = tailorDom.getContext("2d");
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.strokeStyle = "#5e993e";
        ctx.clearRect(0, 0, width, height);
        ctx.fillRect(0, 0, width, height);
        this._endX = el.offsetX;
        const dw = this._endX - this._startX;
        const dh = parseInt((dw / minW) * minh);
        ctx.clearRect(this._startX, this._startY, dw, dh);
        ctx.strokeRect(this._startX, this._startY, dw, dh);
      };
    };

    const cancelXy = () => {
      const { id = "video" } = this.configuration;
      const parentElement = document.getElementById(id);
      tailorDom.onmousemove = null;
      const controlsDom = getElement("controls-tag", this.tag);
      const audioDom = getElement("audio-tag", this.tag);
      const { x, y } = switchXy(
        this.pictureIndex,
        this._realVideoWidth,
        this._realVideoHeight,
        this._startX,
        this._startY,
        width,
        height
      );
      const { w, h } = switchWh(
        this._endX,
        this._startX,
        width,
        height,
        this._realVideoWidth,
        this._realVideoHeight
      );
      if ((!this._endX && typeof this._endX !== "number") || w === 0) {
        tailorDom.style.display = "none";
        this.isEnlarge = false;
        getElement("enlarge-tag", this.tag).style.display = "block";
        getElement("cancel-enlarge-tag", this.tag).style.display = "none";
        if (videoDom.paused) getElement("play-tag", this.tag).onclick();
        this._resetCoordinates();
      } else {
        if (videoDom.paused) {
          tailorDom.style.display = "none";
          getElement("play-tag", this.tag).style.display = "none";
          getElement("pause-tag", this.tag).style.display = "block";
          videoDom.play();
          this.played = true;
          this.paused = false;
          audioDom && audioDom.play();
        }
        cancelAnimationFrame(this._render);
        zoomLoop(x, y, w, h);
      }
      controlsDom.style.display = "block";
      parentElement.removeChild(tailorDom);
    };

    tailorDom.onmousedown = getXy;
    tailorDom.onmouseup = cancelXy;
    tailorDom.onmouseleave = cancelXy;
    return tailorDom;
  },

  // ─── 播放/暂停按钮（委托给 icons.js）─────────────────────────
  _addButtonSpacing(dom) {
    dom.style.margin = "0 5px";
  },

  _createPlayButton() {
    return createPlayButtonSvg(this.tag, this.configuration.stopClickPlay);
  },

  _createPausedButton() {
    return createPausedButtonSvg(this.tag, this.configuration.stopClickPlay);
  },

  _createEnlargeButton() {
    return createEnlargeButtonSvg(this.tag);
  },

  _createCancelEnlargeButton() {
    return createCancelEnlargeButtonSvg(this.tag);
  },

  // ─── 播放/暂停逻辑 ───────────────────────────────────────────
  playHandler(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom) {
    this.played = true;
    this.paused = false;
    playDom && (playDom.style.display = "none");
    pausedDom && (pausedDom.style.display = "block");
    videoDom.play();
    audioDom && audioDom.play();
    if (this.isEnlarge) {
      const { width, height } = this._getWidthAndHeight();
      const { x, y } = switchXy(
        this.pictureIndex,
        this._realVideoWidth,
        this._realVideoHeight,
        this._startX,
        this._startY,
        width,
        height
      );
      const { w, h } = switchWh(
        this._endX,
        this._startX,
        width,
        height,
        this._realVideoWidth,
        this._realVideoHeight
      );
      this._render = zoomLoop(x, y, w, h);
    } else {
      this._render = loop(this.pictureIndex, this._realVideoWidth, this._realVideoHeight, true);
    }
  },

  pasueHandler(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom) {
    this.played = false;
    this.paused = true;
    playDom && (playDom.style.display = "block");
    pausedDom && (pausedDom.style.display = "none");
    videoDom.pause();
    audioDom && audioDom.pause();
    if (this.isEnlarge) {
      const { width, height } = this._getWidthAndHeight();
      const { x, y } = switchXy(
        this.pictureIndex,
        this._realVideoWidth,
        this._realVideoHeight,
        this._startX,
        this._startY,
        width,
        height
      );
      const { w, h } = switchWh(
        this._endX,
        this._startX,
        width,
        height,
        this._realVideoWidth,
        this._realVideoHeight
      );
      this._render = zoomLoop(x, y, w, h);
    } else {
      this._render = loop(this.pictureIndex, this._realVideoWidth, this._realVideoHeight, true);
    }
  },

  _addPlayEvent(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom) {
    playDom.onclick = () => {
      this.playHandler(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom);
    };
  },

  _addPauseEvent(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom) {
    pausedDom.onclick = () => {
      this.pasueHandler(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom);
    };
  },

  // ─── 时间展示 ─────────────────────────────────────────────────
  _createTime() {
    const dom = document.createElement("span");
    dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`;
    dom.style.cssText =
      "font-size:14px;font-family:MicrosoftYaHei;color:#FFFFFF;margin-left:25px;";
    dom.className = "bc-timer";
    dom.setAttribute("timer-tag", this.tag);
    return dom;
  },

  // ─── 画面切换按钮 ─────────────────────────────────────────────
  _createPrePictureButton() {
    const dom = document.createElement("div");
    dom.style.cssText =
      "width:72px;height:32px;background:#fff;border-radius:4px;display:flex;justify-content:center;align-items:center;font-size:14px;color:#333;margin-left:20px;cursor:pointer;";
    dom.innerText = "前一画面";
    return dom;
  },

  _createNextPictureButton() {
    const dom = document.createElement("div");
    dom.style.cssText =
      "width:72px;height:32px;background:#fff;border-radius:4px;display:flex;justify-content:center;align-items:center;font-size:14px;color:#333;margin-left:16px;cursor:pointer;";
    dom.innerText = "后一画面";
    return dom;
  },

  onPictureIndexChange(value) {},

  _addPreEvent(preDom, drawFirstPicture, loop) {
    preDom.onclick = () => {
      const enlargeDom = getElement("enlarge-tag", this.tag);
      const cancelEnlargeDom = getElement("cancel-enlarge-tag", this.tag);
      if (this.pictureIndex === 0) {
        this.pictureIndex = this.maxPictureIndex;
      } else {
        this.pictureIndex--;
      }
      this.onPictureIndexChange(this.pictureIndex);
      this.modifyText();
      drawFirstPicture(this.pictureIndex, this._realVideoWidth, this._realVideoHeight);
      this._render = loop(this.pictureIndex, this._realVideoWidth, this._realVideoHeight, true);
      enlargeDom.style.display = "flex";
      cancelEnlargeDom.style.display = "none";
      this.isEnlarge = false;
    };
  },

  _addNextEvent(nextDom, drawFirstPicture, loop) {
    nextDom.onclick = () => {
      const enlargeDom = getElement("enlarge-tag", this.tag);
      const cancelEnlargeDom = getElement("cancel-enlarge-tag", this.tag);
      if (this.pictureIndex === this.maxPictureIndex) {
        this.pictureIndex = 0;
      } else {
        this.pictureIndex++;
      }
      this.onPictureIndexChange(this.pictureIndex);
      this.modifyText();
      drawFirstPicture(this.pictureIndex, this._realVideoWidth, this._realVideoHeight);
      this._render = loop(this.pictureIndex, this._realVideoWidth, this._realVideoHeight, true);
      enlargeDom.style.display = "flex";
      cancelEnlargeDom.style.display = "none";
      this.isEnlarge = false;
    };
  },

  // ─── 局部放大按钮事件 ─────────────────────────────────────────
  _addEnlargeEvent(enlargeDom, cancelEnlargeDom, switchXy, switchWh, zoomLoop, videoDom) {
    enlargeDom.onclick = () => {
      const { width, height } = this._getWidthAndHeight();
      const { id = "video" } = this.configuration;
      const parentElement = document.getElementById(id);
      const controlsDom = getElement("controls-tag", this.tag);
      const tailorDom = this._createTailorCanvas(switchXy, switchWh, zoomLoop, videoDom);
      parentElement.appendChild(tailorDom);
      this.isEnlarge = true;
      enlargeDom.style.display = "none";
      cancelEnlargeDom.style.display = "block";
      tailorDom.style.display = "block";
      const ctx = tailorDom.getContext("2d");
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.fillRect(0, 0, width, height);
      getElement("pause-tag", this.tag).onclick();
      controlsDom.style.display = "none";
    };
  },

  _addCancelEnlargeEvent(enlargeDom, cancelEnlargeDom, loop) {
    cancelEnlargeDom.onclick = () => {
      this.isEnlarge = false;
      enlargeDom.style.display = "block";
      cancelEnlargeDom.style.display = "none";
      cancelAnimationFrame(this._render);
      this._render = loop(this.pictureIndex, this._realVideoWidth, this._realVideoHeight, true);
    };
  },

  // ─── 倍速按钮 ─────────────────────────────────────────────────
  _createSpeedButton() {
    const dom = document.createElement("div");
    dom.style.cssText =
      "width:58px;height:32px;border-radius:4px;cursor:pointer;background:#fff;box-sizing:border-box;display:flex;justify-content:center;align-items:center;font-size:14px;color:#333;margin-left:16px;";
    dom.innerText = "1X";
    dom.id = "bc-speed";
    dom.setAttribute("speed-tag", this.tag);
    return dom;
  },

  _addSpeedEvent(dom, videoDom) {
    const { speed = [0.5, 1, 1.5, 2] } = this.configuration;
    this.speedList = speed;
    const audioDom = getElement("audio-tag", this.tag);
    dom.onclick = () => {
      const tempSpeed = Number(dom.innerText.split("X")[0]);
      const tempIndex = this.speedList.findIndex((item) => item === tempSpeed);
      this.speed =
        tempIndex === this.speedList.length - 1
          ? this.speedList[0]
          : this.speedList[tempIndex + 1];
      videoDom.playbackRate = String(this.speed);
      if (audioDom) audioDom.playbackRate = String(this.speed);
      dom.innerText = `${this.speed}X`;
    };
  },

  // ─── 音频按钮 ─────────────────────────────────────────────────
  _createAudioButton(audioIndex) {
    const dom = document.createElement("div");
    dom.style.cssText =
      "width:56px;height:32px;border-radius:4px;cursor:pointer;background:#fff;box-sizing:border-box;font-size:14px;color:#333;display:flex;justify-content:center;align-items:center;margin-left:16px;";
    dom.innerText = `音频${audioIndex ? audioIndex + 1 : 1}`;
    dom.id = "bc-audio-button";
    dom.setAttribute("audio-button-tag", this.tag);
    return dom;
  },

  _addAudioEvent(audioButtonDom, audioDom, audioIndex) {
    const { audioList } = this.configuration;
    this.audioList = audioList;
    audioDom.src = this.audioList[audioIndex ? audioIndex : 0];
    audioButtonDom.onclick = () => {
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
  },

  _createAudioDom(time) {
    const { id = "video" } = this.configuration;
    const parentElement = document.getElementById(id);
    const dom = document.createElement("audio");
    dom.setAttribute("audio-tag", this.tag);
    dom.src = "";
    dom.id = "bc-audio";
    parentElement.appendChild(dom);
    return dom;
  },

  // ─── 进度条 ───────────────────────────────────────────────────
  _createSlider() {
    const outBarDom = document.createElement("div");
    outBarDom.style.cssText =
      "width:100%;height:6px;background:rgba(255,255,255,0.3);border-radius:6px;position:relative;";
    outBarDom.id = "bc-outBar";
    outBarDom.setAttribute("outBar-tag", this.tag);

    const inlineBarDom = document.createElement("div");
    inlineBarDom.id = "bc-inline-slider";
    inlineBarDom.setAttribute("inline-slider-tag", this.tag);
    inlineBarDom.style.cssText =
      "width:0;height:6px;border-radius:6px;position:absolute;left:0;bottom:0;z-index:1;background:#1890FF;max-width:100%;";
    outBarDom.appendChild(inlineBarDom);

    const btnChildDom = document.createElement("div");
    btnChildDom.style.cssText =
      "width:16px;height:16px;border-radius:100%;background:#1890ff;";
    const btnDom = document.createElement("div");
    btnDom.style.cssText =
      "width:32px;height:32px;background:rgba(255,255,255,0.69);border-radius:100%;display:flex;justify-content:center;align-items:center;position:absolute;top:-12px;left:-12px;z-index:2;cursor:pointer;";
    btnDom.appendChild(btnChildDom);
    btnDom.id = "bc-slider-btn";
    btnDom.setAttribute("slider-btn-tag", this.tag);
    outBarDom.appendChild(btnDom);
    return outBarDom;
  },

  _addBtnEvent(dom) {},

  // ─── 控制条布局组装 ───────────────────────────────────────────
  _createPlayAndTimeArea(videoDom, loop, zoomLoop, switchXy, switchWh, audioDom, drawFirstPicture) {
    const { buttonList = ["switchPicture", "enlarge", "audio", "speed"] } = this.configuration;
    const dom = document.createElement("div");
    dom.style.cssText = "height:100%;display:flex;align-items:center;";

    const playDom = this._createPlayButton();
    const pausedDom = this._createPausedButton();
    this._addPlayEvent(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom);
    this._addPauseEvent(playDom, pausedDom, videoDom, loop, zoomLoop, switchXy, switchWh, audioDom);
    dom.appendChild(playDom);
    dom.appendChild(pausedDom);

    if (buttonList.includes("switchPicture")) {
      const preDom = this._createPrePictureButton();
      const nextDom = this._createNextPictureButton();
      this._addPreEvent(preDom, drawFirstPicture, loop);
      this._addNextEvent(nextDom, drawFirstPicture, loop);
      dom.appendChild(preDom);
      dom.appendChild(nextDom);
    }
    if (this.showTime) {
      dom.appendChild(this._createTime());
    }
    return dom;
  },

  _createHandleArea(drawFirstPicture, loop, switchXy, switchWh, zoomLoop, videoDom, audioDom, audioIndex) {
    const {
      buttonList = ["switchPicture", "enlarge", "audio", "speed"],
      audioList,
    } = this.configuration;
    const handleAreaDom = document.createElement("div");
    handleAreaDom.style.cssText = "height:100%;display:flex;align-items:center;";

    if (buttonList.includes("enlarge")) {
      const enlargeDom = this._createEnlargeButton();
      const cancelEnlargeDom = this._createCancelEnlargeButton();
      this._addEnlargeEvent(enlargeDom, cancelEnlargeDom, switchXy, switchWh, zoomLoop, videoDom);
      this._addCancelEnlargeEvent(enlargeDom, cancelEnlargeDom, loop);
      handleAreaDom.appendChild(enlargeDom);
      handleAreaDom.appendChild(cancelEnlargeDom);
    }
    if (buttonList.includes("audio") && audioList && audioList.length > 0) {
      const audioButtonDom = this._createAudioButton(audioIndex);
      this._addAudioEvent(audioButtonDom, audioDom);
      handleAreaDom.appendChild(audioButtonDom);
    }
    if (buttonList.includes("speed")) {
      const speedDom = this._createSpeedButton();
      this._addSpeedEvent(speedDom, videoDom);
      handleAreaDom.appendChild(speedDom);
    }
    return handleAreaDom;
  },

  _createControls(drawFirstPicture, videoDom, loop, switchXy, switchWh, zoomLoop, audioDom, audioIndex) {
    const { id = "video", zIndex = 1000 } = this.configuration;
    if (!this.showOption) return;

    const { width } = this._getWidthAndHeight();
    const parentElement = document.getElementById(id);

    const controlsDom = document.createElement("div");
    controlsDom.style.cssText = `width:${width}px;position:absolute;z-index:${
      zIndex + 10
    };bottom:0;left:0;display:block;background:linear-gradient(to bottom,rgba(0,0,0,0),rgba(0,0,0,0.6));`;

    const sliderArea = document.createElement("div");
    sliderArea.style.cssText =
      "width:100%;box-sizing:border-box;padding:0 16px;display:flex;align-items:center;margin:18px 0;";
    controlsDom.appendChild(sliderArea);

    const buttonArea = document.createElement("div");
    buttonArea.style.cssText =
      "width:100%;box-sizing:border-box;padding:0 12px;display:flex;align-items:center;justify-content:space-between;margin:0 0 18px 0;";
    controlsDom.appendChild(buttonArea);

    buttonArea.appendChild(
      this._createPlayAndTimeArea(videoDom, loop, zoomLoop, switchXy, switchWh, audioDom, drawFirstPicture)
    );
    buttonArea.appendChild(
      this._createHandleArea(drawFirstPicture, loop, switchXy, switchWh, zoomLoop, videoDom, audioDom, audioIndex)
    );

    if (this.showProgressBar) {
      sliderArea.appendChild(this._createSlider());
    }

    controlsDom.id = "bc-controls";
    controlsDom.setAttribute("controls-tag", this.tag);
    parentElement.appendChild(controlsDom);
  },
};

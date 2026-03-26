import scale from "../utils/scale.js";
import { getHMS, getElement } from "../utils/util.js";

export const videoElementMethods = {
  _createVideoElement(drawFirstPicture, videoTime) {
    const { url, audioList = [], id = "video" } = this.configuration;
    const video = document.createElement("video");
    video.muted = audioList.length >= 1;
    video.autoplay = false;
    video.preload = "auto";
    video.src = url;
    video.currentTime = videoTime ? videoTime : 1;
    video.id = "bc-video";
    video.setAttribute("video-tag", this.tag);
    video.style.width = "0";
    video.style.height = "0";
    if (videoTime) {
      this.initVideo.currentTime = videoTime;
      this.initVideo.formatCurrentTime = getHMS(videoTime);
    }

    function setFirstPicture(e) {
      this._realVideoWidth = e.target.videoWidth;
      this._realVideoHeight = e.target.videoHeight;
      drawFirstPicture(this.pictureIndex, this._realVideoWidth, this._realVideoHeight);
      video.currentTime = videoTime ? videoTime : 0;
    }

    function setVideoTime(e) {
      this.initVideo.videoLength = e.target.duration;
      this.initVideo.formatVideoLength = getHMS(e.target.duration);
      if (this.showOption) {
        const dom = getElement("timer-tag", this.tag);
        const audioDom = getElement("audio-tag", this.tag);
        this.showTime &&
          (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
        if (this.showProgressBar) {
          new scale(
            "slider-btn-tag",
            "outBar-tag",
            "inline-slider-tag",
            this.initVideo.videoLength,
            (e) => {
              video.currentTime = e;
              this.initVideo.currentTime = e;
              if (audioDom) {
                audioDom.currentTime = e;
                if (audioDom.paused && this.played) audioDom.play();
              }
              this.initVideo.formatCurrentTime = getHMS(e);
              dom &&
                (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
            },
            "",
            this.tag
          );
        }
      }
    }

    function handleVideoTimeUpdate(e) {
      this.initVideo.currentTime = e.target.currentTime;
      this.initVideo.formatCurrentTime = getHMS(e.target.currentTime);
      const audioDom = getElement("audio-tag", this.tag);
      if (this.showOption) {
        const dom = getElement("timer-tag", this.tag);
        this.showTime &&
          (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
        if (this.showProgressBar) {
          const outBarDom = getElement("outBar-tag", this.tag);
          const inlineBarDom = getElement("inline-slider-tag", this.tag);
          const btnDom = getElement("slider-btn-tag", this.tag);
          const x =
            (this.initVideo.currentTime / this.initVideo.videoLength) *
            outBarDom.getBoundingClientRect().width;
          inlineBarDom.style.width = Math.max(0, x) + "px";
          btnDom.style.left = x - 16 + "px";
        }
      }
      if (
        audioDom &&
        Math.abs(parseFloat(video.currentTime) - parseFloat(audioDom.currentTime)) > 0.5
      ) {
        audioDom.currentTime = video.currentTime;
      }
      if (video.ended) {
        this.played = false;
        this.paused = true;
        if (this.showOption) {
          getElement("play-tag", this.tag).style.display = "block";
          getElement("pause-tag", this.tag).style.display = "none";
        }
        audioDom && audioDom.pause();
      }
    }

    video.addEventListener("loadeddata", setFirstPicture.bind(this));
    video.addEventListener("loadedmetadata", setVideoTime.bind(this));
    video.addEventListener("timeupdate", handleVideoTimeUpdate.bind(this));
    document.getElementById(id).appendChild(video);
    return video;
  },

  setFirstPicture(e) {
    this._realVideoWidth = e.target.videoWidth;
    this._realVideoHeight = e.target.videoHeight;
    const video = document.getElementById(this.configuration.videoId);
    this.drawFirstPicture(this.pictureIndex, this._realVideoWidth, this._realVideoHeight);
    video.currentTime = this.configuration.videoTime ? this.configuration.videoTime : 0;
  },

  setVideoTime(e) {
    this.initVideo.videoLength = e.target.duration;
    this.initVideo.formatVideoLength = getHMS(e.target.duration);
    const video = document.getElementById(this.configuration.videoId);
    if (this.showOption) {
      const dom = getElement("timer-tag", this.tag);
      const audioDom = getElement("audio-tag", this.tag);
      this.showTime &&
        (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
      if (this.showProgressBar) {
        new scale(
          "slider-btn-tag",
          "outBar-tag",
          "inline-slider-tag",
          this.initVideo.videoLength,
          (e) => {
            video.currentTime = e;
            this.initVideo.currentTime = e;
            if (audioDom) {
              audioDom.currentTime = e;
              if (audioDom.paused && this.played) audioDom.play();
            }
            this.initVideo.formatCurrentTime = getHMS(e);
            dom &&
              (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
          },
          this.tag
        );
      }
    }
  },

  handleVideoTimeUpdate(e) {
    this.initVideo.currentTime = e.target.currentTime;
    this.initVideo.formatCurrentTime = getHMS(e.target.currentTime);
    const video = document.getElementById(this.configuration.videoId);
    const audioDom = getElement("audio-tag", this.tag);
    if (this.showOption) {
      const dom = getElement("timer-tag", this.tag);
      this.showTime &&
        (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
      if (this.showProgressBar) {
        const outBarDom = getElement("outBar-tag", this.tag);
        const inlineBarDom = getElement("inline-slider-tag", this.tag);
        const btnDom = getElement("slider-btn-tag", this.tag);
        const x =
          (this.initVideo.currentTime / this.initVideo.videoLength) *
          outBarDom.getBoundingClientRect().width;
        inlineBarDom.style.width = Math.max(0, x) + "px";
        btnDom.style.left = x - 16 + "px";
      }
    }
    if (
      audioDom &&
      Math.abs(parseFloat(video.currentTime) - parseFloat(audioDom.currentTime)) > 0.5
    ) {
      audioDom.currentTime = video.currentTime;
    }
    if (video.ended) {
      this.played = false;
      this.paused = true;
      if (this.showOption) {
        getElement("play-tag", this.tag).style.display = "block";
        getElement("pause-tag", this.tag).style.display = "none";
      }
      audioDom && audioDom.pause();
    }
  },

  async _getVideoElement(drawFirstPicture, videoId, videoTime) {
    await new Promise((resolve) => {
      const video = document.getElementById(videoId);
      if (video.readyState >= 1) {
        resolve(video);
      } else {
        video.addEventListener("loadedmetadata", resolve);
      }
    });
    const video = document.getElementById(videoId);
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const videoDuration = video.duration;

    setTimeout(() => {
      this._realVideoWidth = videoWidth;
      this._realVideoHeight = videoHeight;
      video.currentTime = videoTime ? videoTime : 0;
      drawFirstPicture(this.pictureIndex, this._realVideoWidth, this._realVideoHeight);
      this.initVideo.videoLength = videoDuration;
      this.initVideo.formatVideoLength = getHMS(videoDuration);
      if (this.showOption) {
        const dom = getElement("timer-tag", this.tag);
        const audioDom = getElement("audio-tag", this.tag);
        this.showTime &&
          (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
        if (this.showProgressBar) {
          new scale(
            "slider-btn-tag",
            "outBar-tag",
            "inline-slider-tag",
            this.initVideo.videoLength,
            (e) => {
              video.currentTime = e;
              this.initVideo.currentTime = e;
              if (audioDom) {
                audioDom.currentTime = e;
                if (audioDom.paused && this.played) audioDom.play();
              }
              this.initVideo.formatCurrentTime = getHMS(e);
              dom &&
                (dom.innerText = `${this.initVideo.formatCurrentTime} / ${this.initVideo.formatVideoLength}`);
            },
            "",
            this.tag
          );
        }
      }
    }, 800);

    video.autoplay = false;
    video.preload = "auto";
    if (videoTime) {
      this.initVideo.currentTime = videoTime;
      this.initVideo.formatCurrentTime = getHMS(videoTime);
    }
    this.loadeddataHandler = this.setFirstPicture.bind(this);
    this.loadedmetadataHandler = this.setVideoTime.bind(this);
    this.timeupdateHandler = this.handleVideoTimeUpdate.bind(this);
    video.addEventListener("loadeddata", this.loadeddataHandler);
    video.addEventListener("loadedmetadata", this.loadedmetadataHandler);
    video.addEventListener("timeupdate", this.timeupdateHandler);
    return video;
  },
};

/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-07-08 09:50:31
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-08 16:04:09
 */
const scale = function (btn, bar, step, timeLength, callback, endBack) {
  this.btn = document.getElementById(btn);
  this.bar = document.getElementById(bar);
  this.step = document.getElementById(step);
  this.init(timeLength, callback, endBack);
};
scale.prototype = {
  init: function (timeLength, callback, endBack) {
    const f = this,
      g = document,
      b = window,
      m = Math;
    let time = 0;
    f.btn.onmousedown = function (e) {
      const x = (e || b.event).clientX;
      const l = this.offsetLeft;
      const max = f.bar.offsetWidth - this.offsetWidth;
      g.onmousemove = function (e) {
        const thisX = (e || b.event).clientX;
        const to = m.min(max, m.max(-12, l + (thisX - x)));
        f.btn.style.left = to + "px";
        // m.round
        f.ondrag(to);
        time =
          m.max(0, to / max) * timeLength <= 0
            ? 0
            : m.max(0, to / max) * timeLength;
        callback && callback(time);
        b.getSelection
          ? b.getSelection().removeAllRanges()
          : g.selection.empty();
      };
      g.onmouseup = new Function("this.onmousemove=null");
    };
    f.btn.onmouseup = () => {
      endBack && endBack(time);
    };
  },
  ondrag: function (x) {
    this.step.style.width = Math.max(0, x) + "px";
  },
};
export default scale;

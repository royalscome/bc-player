/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-07-04 16:54:56
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-11 18:15:18
 */
import { isgy } from "./util.js";
const useCanavs = (canvasDom, videoId, line, column) => {
  const ctx = canvasDom.getContext("2d");
  let render = null;
  const getCoordinatesList = (ow, oh, line, column) => {
    const coordinatesList = [];
    const w = ow / column;
    const h = oh / line;
    function columnCycle(m, column) {
      for (let n = 0; n < column; n++) {
        coordinatesList.push({
          x: 0 + n * w,
          y: 0 + m * h,
        });
      }
    }
    function lineCycle(line, column) {
      for (let m = 0; m < line; m++) {
        columnCycle(m, column);
      }
    }
    lineCycle(line, column);
    return coordinatesList;
  };
  const loop = (index, ow, oh, fixed = false) => {
    const videoDom = document.getElementById(videoId);
    const coordinatesList = getCoordinatesList(ow, oh, line, column);
    render && cancelAnimationFrame(render);
    ctx.drawImage(
      videoDom,
      coordinatesList[index].x,
      coordinatesList[index].y,
      ow / column,
      oh / line,
      0,
      0,
      canvasDom.width,
      canvasDom.height
    );
    if (!videoDom.paused) {
      render = requestAnimationFrame(() => {
        loop(index, ow, oh);
      });
      return render;
    }
  };
  const drawFirstPicture = (index, ow, oh) => {
    const videoDom = document.getElementById(videoId);
    const coordinatesList = getCoordinatesList(ow, oh, line, column);
    ctx.drawImage(
      videoDom,
      coordinatesList[index].x,
      coordinatesList[index].y,
      ow / column,
      oh / line,
      0,
      0,
      canvasDom.width,
      canvasDom.height
    );
  };
  /**
   *
   * @param {*} index 当前第几个画面
   * @param {*} ow 视频实际宽
   * @param {*} oh 视频实际高
   * @param {*} x 当前点的x坐标
   * @param {*} y 当前点的y坐标
   * @param {*} w 容器的宽
   * @param {*} h 容器的高
   * @returns
   */
  const switchXy = (index, ow, oh, x, y, w, h) => {
    const coordinatesList = getCoordinatesList(ow, oh, line, column);
    return {
      x: coordinatesList[index].x + (x / w) * (ow / column),
      y: coordinatesList[index].y + (y / h) * (oh / line),
    };
  };
  /**
   *
   * @param {*} x 结束点
   * @param {*} startX 起始点
   * @param {*} w 容器宽
   * @param {*} h 容器高
   * @param {*} ow 视频实际宽
   * @param {*} oh 视频实际高
   * @returns
   */
  const switchWh = (x, startX, w, h, ow, oh) => {
    const divsor = isgy(ow / column, oh / line);
    const minW = ow / column / divsor;
    const minh = oh / line / divsor;
    return {
      w: ((x - startX) / w) * (ow / column),
      h: (((parseInt(x - startX) / minW) * minh) / h) * (oh / line),
    };
  };
  const zoomLoop = (x, y, w, h) => {
    const videoDom = document.getElementById(videoId);
    ctx.drawImage(
      videoDom,
      x,
      y,
      w,
      h,
      0,
      0,
      canvasDom.width,
      canvasDom.height
    );
    if (!videoDom.paused) {
      render = requestAnimationFrame(() => {
        zoomLoop(x, y, w, h);
      });
      return render;
    }
  };
  return {
    drawFirstPicture,
    loop,
    switchXy,
    switchWh,
    zoomLoop,
  };
};

export default useCanavs;

/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-07-04 16:54:56
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-08 17:34:29
 */
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
  const loop = (index, ow, oh) => {
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
  return {
    drawFirstPicture,
    loop,
  };
};

export default useCanavs;

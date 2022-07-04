/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-07-04 16:54:56
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-04 18:03:27
 */
const useCanavs = (canvasDom, videoId, line, column) => {
  const ctx = canvasDom.getContext("2d");
  // const
  const drawFirstPicture = (index, ow, oh) => {
    const videoDom = document.getElementById(videoId);
    // ctx.drawImage(
    //   videoDom
    // )
  };
  return {
    drawFirstPicture,
  };
};

export default useCanavs;

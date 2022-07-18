/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-07-07 10:39:22
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-18 15:16:34
 */
export const getHMS = (time) => {
  const hour =
    parseInt(time / 3600) < 10
      ? "0" + parseInt(time / 3600)
      : parseInt(time / 3600);
  const min =
    parseInt((time % 3600) / 60) < 10
      ? "0" + parseInt((time % 3600) / 60)
      : parseInt((time % 3600) / 60);
  const sec =
    parseInt((time % 3600) % 60) < 10
      ? "0" + parseInt((time % 3600) % 60)
      : parseInt((time % 3600) % 60);
  return hour + ":" + min + ":" + sec;
};

// 求最大公约数
export const isgy = (a, b) => {
  return a % b == 0 ? b : isgy(b, a % b);
};

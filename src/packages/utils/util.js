/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-07-07 10:39:22
 * @LastEditors: weiyang
 * @LastEditTime: 2023-09-04 09:56:26
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

export const observer = (pointer, name, callback) => {
  Object.defineProperty(pointer, name, {
    get(){return pointer[`_${name}`]},
    set(newVal){
      console.log("set")
      pointer[`_${name}`] = newVal
      callback && callback(newVal);
    }
  })
}

// 取自定义属性元素
export const getElement = (tagName, tag) => {
  return document.querySelector(`[${tagName}="${tag}"]`)
}

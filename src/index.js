/*
 * @Date: 2022-12-30 14:50:44
 * @Author: weiyang
 * @LastEditors: weiyang
 * @LastEditTime: 2024-09-10 22:59:01
 * @FilePath: /bc-player/src/index.js
 */
import bcPlayer from "./packages/bcPlayer.js";

// export default bcPlayer;
// 兼容 CommonJS 和 ES6 模块
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = bcPlayer;
  } else {
    window.BCPlayer = bcPlayer;
  }
  
  export default bcPlayer;

import 'uno.css';
import '@unocss/reset/normalize.css'
import '@unocss/reset/eric-meyer.css'
import '@unocss/reset/tailwind.css'
import './styles/main.css'

import { fabric } from 'fabric';

import data from '../data.json';

const WIDTH = 50, HEIGHT = 50;
const ROW = data.length, COLUMN = data[0].length;

const canvas = new fabric.StaticCanvas('board', { width: WIDTH * COLUMN, height: HEIGHT * ROW });

function renderBoard() {
  const COLOR = [
    'rgb(80,198,81)',
    'rgb(239,222,76)',
    'rgb(249,145,65)',
    'rgb(64,77,141)',
  ];
  for (let i = 0; i < ROW; i++) {
    for (let j = 0; j < COLUMN; j++) {
      const tr0 = new fabric.Triangle({
        top: i * HEIGHT + HEIGHT / 2,
        left: j * WIDTH + WIDTH,
        fill: COLOR[data[i][j][0]],
        width: WIDTH,
        height: HEIGHT / 2,
        angle: 180
      });
      const tr1 = new fabric.Triangle({
        top: i * HEIGHT + HEIGHT,
        left: j * WIDTH + WIDTH / 2,
        fill: COLOR[data[i][j][1]],
        width: WIDTH,
        height: HEIGHT / 2,
        angle: 270
      });
      const tr2 = new fabric.Triangle({
        top: i * HEIGHT + HEIGHT / 2,
        left: j * WIDTH,
        fill: COLOR[data[i][j][2]],
        width: WIDTH,
        height: HEIGHT / 2,
      });
      const tr3 = new fabric.Triangle({
        top: i * HEIGHT,
        left: j * WIDTH + WIDTH / 2,
        fill: COLOR[data[i][j][3]],
        width: WIDTH,
        height: HEIGHT / 2,
        angle: 90
      });
      canvas.add(tr0, tr1, tr2, tr3);
    }
  }
}

renderBoard();

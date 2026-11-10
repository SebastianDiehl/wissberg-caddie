/*
 * Course data: Golfclub Rheinhessen (Hofgut Wißberg), 18 holes, par 72.
 * Unofficial. Facts compiled from the club's public scorecard (par, stroke index),
 * the tee signs on the course (green depth in metres) and TheGrint (course rating / slope).
 *
 * holes[n]: par, hcp = stroke index, depth = green depth in metres (front to back)
 * ratings[tee]: m / w = [course rating, slope] for men / women, len = total length in metres
 */
window.COURSE_DATA = {
  id: "rheinhessen",
  name: "Golfclub Rheinhessen",
  center: [49.840, 7.975],
  par: 72,
  place: "Hofgut Wißberg",
  search: ["Golfclub Rheinhessen Hofgut Wißberg", "Golfclub Rheinhessen", "Hofgut Wißberg Golf"],
  match: "rheinhessen|wi(ß|ss)berg",
  tees: { a: "A", b: "B", c: "C", d: "D", e: "E", f: "F" },
  defaultTee: "b",
  holes: {
    1:{par:4,hcp:7},
    2:{par:5,hcp:11,depth:37},
    3:{par:3,hcp:17},
    4:{par:4,hcp:5,depth:36},
    5:{par:4,hcp:3,depth:31},
    6:{par:4,hcp:1,depth:32},
    7:{par:4,hcp:13},
    8:{par:3,hcp:15},
    9:{par:5,hcp:9,depth:24},
    10:{par:4,hcp:2,depth:40},
    11:{par:3,hcp:18,depth:34},
    12:{par:4,hcp:10,depth:37},
    13:{par:4,hcp:14,depth:36},
    14:{par:5,hcp:4,depth:33},
    15:{par:4,hcp:8,depth:29},
    16:{par:3,hcp:16,depth:30},
    17:{par:4,hcp:6,depth:34},
    18:{par:5,hcp:12,depth:22}
    },
  ratings: {
    a:{m:[72.7,134],w:[79.0,148],len:6136},
    b:{m:[70.0,129],w:[75.5,139],len:5547},
    c:{m:[67.4,124],w:[72.4,130],len:5024},
    d:{m:[64.3,119],w:[68.8,119],len:4390},
    e:{m:[62.8,116],w:[67.0,114],len:4074},
    f:{m:[60.8,111],w:[64.4,106],len:3647}
    }
};

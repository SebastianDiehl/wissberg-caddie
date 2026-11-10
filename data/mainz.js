/*
 * Course data: Mainzer Golfclub (Budenheim), 18 holes, par 72.
 * Unofficial. Par, stroke index and course rating / slope per tee from GolfPass
 * (scorecard data may be out of date; check against the club's current scorecard).
 * The 6-hole short course is not included.
 *
 * holes[n]: par, hcp = stroke index
 * ratings[tee]: m / w = [course rating, slope] for men / women (null = not rated), len = total length in metres
 */
(window.COURSES = window.COURSES || {}).mainz = {
  id: "mainz",
  name: "Mainzer Golfclub",
  place: "Budenheim",
  center: [50.016, 8.155],          // approximate; refined via the OpenStreetMap search
  search: ["Mainzer Golfclub Budenheim", "Mainzer Golfclub", "Golfplatz Budenheim"],
  match: "mainz|budenheim",
  par: 72,
  tees: { w: "Weiß", y: "Gelb", b: "Blau", r: "Rot", g: "Grün" },
  defaultTee: "y",
  holes: {
    1:{par:4,hcp:7},
    2:{par:3,hcp:11},
    3:{par:4,hcp:5},
    4:{par:4,hcp:15},
    5:{par:5,hcp:3},
    6:{par:3,hcp:17},
    7:{par:5,hcp:1},
    8:{par:3,hcp:13},
    9:{par:4,hcp:9},
    10:{par:4,hcp:2},
    11:{par:5,hcp:8},
    12:{par:4,hcp:4},
    13:{par:3,hcp:18},
    14:{par:4,hcp:16},
    15:{par:4,hcp:12},
    16:{par:5,hcp:6},
    17:{par:4,hcp:14},
    18:{par:4,hcp:10}
  },
  ratings: {
    w:{m:[73.9,141],w:null,len:6001},
    y:{m:[71.7,135],w:null,len:5559},
    b:{m:[68.8,128],w:[74.5,132],len:5032},
    r:{m:[66.8,124],w:[72.0,130],len:4698},
    g:{m:[58.8,102],w:[59.8,101],len:3030}
  }
};

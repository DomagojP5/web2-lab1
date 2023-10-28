var data = [
    { "id": "1", "name": "Split", "win": 1, "draw": 2, "lose": 1 },
    { "id": "2", "name": "Dinamo", "win": 4, "draw": 0, "lose": 0 },
    { "id": "3", "name": "Hajduk", "win": 2, "draw": 0, "lose": 2 },
    { "id": "4", "name": "Osijek", "win": 1, "draw": 1, "lose": 2 },
    { "id": "5", "name": "Zadar", "win": 0, "draw": 3, "lose": 1 }
];
console.log(data);
data.sort(function (a, b) {
    var a1 = JSON.stringify(a);
    var b1 = JSON.stringify(b);
    console.log("comparing ".concat(a1, " and ").concat(b1, " => a.points=").concat(3 * a.win + a.draw, " vs b.points=").concat(3 * b.win + b.draw, " => ").concat((3 * a.win + a.draw > 3 * b.win + b.draw) ? true : false));
    return (3 * a.win + a.draw > 3 * b.win + b.draw) ? 1 : 0;
});
console.log(data);

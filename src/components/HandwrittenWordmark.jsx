const strokes = [
    // B, starting from the entry flourish.
    ['M 28 115 C 45 127 65 116 75 96 C 85 75 90 48 100 32 C 104 26 108 24 110 27 C 112 32 106 43 101 50 C 89 68 82 88 75 109', 290],
    ['M 76 55 C 91 34 120 22 137 28 C 151 33 148 49 136 60 C 124 71 111 76 97 77 C 116 71 142 73 146 86 C 151 103 128 119 107 121 C 88 123 72 116 68 106 C 65 101 68 96 73 92', 410],
    // a, m, b
    ['M 136 110 C 151 106 159 100 167 88 C 176 74 188 67 197 74 C 205 81 195 102 183 110 C 173 117 164 110 167 99 C 170 86 184 74 198 74 C 202 74 205 76 207 79 C 202 89 194 104 200 111 C 207 118 219 108 228 96', 325],
    ['M 228 96 C 233 86 239 76 241 76 C 244 78 236 101 232 112 C 242 98 254 77 264 78 C 274 79 267 98 260 111 C 270 96 284 77 294 79 C 303 81 294 96 291 104 C 285 119 300 122 315 98', 355],
    ['M 315 98 C 329 78 342 54 344 40 C 346 28 341 27 334 35 C 322 49 315 72 312 92 C 309 109 316 119 328 113 C 340 108 349 92 344 83 C 339 74 330 79 326 88 C 323 96 337 101 351 88', 350],
    // A taller 0 followed by a smaller cursive o.
    ['M 400 61 C 390 54 374 62 364 78 C 353 97 356 113 369 115 C 382 117 397 99 402 82 C 406 71 404 64 400 61', 285],
    ['M 396 108 C 405 103 411 94 417 85 C 425 73 438 73 444 80 C 450 90 439 108 426 113 C 416 117 410 110 413 101 C 416 90 426 79 437 78 C 442 78 445 81 444 86 C 447 91 453 91 459 87', 275],
    // C, h, e, n.
    ['M 530 50 C 537 34 530 24 515 27 C 493 30 471 50 458 73 C 444 97 451 115 471 119 C 489 122 510 116 521 106', 335],
    ['M 521 106 C 536 89 552 61 555 43 C 557 32 553 28 547 35 C 538 46 533 72 527 93 C 523 105 520 112 518 116 C 529 98 542 80 553 80 C 565 80 559 94 553 104 C 548 115 560 120 575 106', 365],
    ['M 575 106 C 587 98 602 87 598 81 C 594 74 580 83 575 95 C 569 107 575 118 586 115 C 597 112 606 102 613 92', 255],
    ['M 613 92 C 620 82 627 75 630 80 C 632 86 623 104 618 114 C 628 99 640 80 650 80 C 661 81 653 95 649 104 C 644 115 653 120 666 114 C 680 108 691 100 704 90', 345],
];

const timedStrokes = [];
let start = 170;
for (const [path, duration] of strokes) {
    timedStrokes.push({ path, duration, start });
    start += duration;
}

export default function HandwrittenWordmark() {
    return (
        <div className="homepage-handwriting-intro" style={{ '--poem-start': `${start + 100}ms` }}>
            <h1 className="homepage-handwriting">
                <span className="homepage-handwriting-label">Bamb0oChen</span>
                <svg viewBox="0 14 732 124" aria-hidden="true" className="homepage-handwriting-art">
                    <defs>
                        <linearGradient id="homepage-handwriting-ink" gradientUnits="userSpaceOnUse" x1="0" y1="25" x2="0" y2="123">
                            <stop stopColor="#ffffff" />
                            <stop offset=".58" stopColor="#f3f6fa" />
                            <stop offset="1" stopColor="#c8d7e6" />
                        </linearGradient>
                    </defs>
                    {timedStrokes.map(({ path, duration, start }) => (
                        <path
                            key={path}
                            d={path}
                            pathLength="1"
                            style={{ '--pen-duration': `${duration}ms`, '--pen-start': `${start}ms` }}
                        />
                    ))}
                </svg>
            </h1>
            <p className="homepage-handwriting-poem" lang="zh-Hans">
                <span>人亦有言：日月于征。</span>
                <span>安得促席，说彼平生。</span>
            </p>
        </div>
    );
}

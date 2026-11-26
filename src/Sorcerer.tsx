export default function Sorcerer({ defeated = false }: { defeated?: boolean }) {
  return (
    <svg
      className={`sorcerer ${defeated ? "dying" : ""}`}
      viewBox="0 0 600 480"
      role="img"
      aria-label={
        defeated
          ? "Malakor collapses and dissolves into violet embers"
          : "Malakor, a hooded sorcerer with glowing violet eyes, holding an arcane staff"
      }
    >
      <defs>
        <linearGradient id="robe" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#55476f" />
          <stop offset=".5" stopColor="#211c38" />
          <stop offset="1" stopColor="#0c1020" />
        </linearGradient>
        <linearGradient id="hood" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#796392" />
          <stop offset=".45" stopColor="#302642" />
          <stop offset="1" stopColor="#111321" />
        </linearGradient>
        <linearGradient id="trim">
          <stop stopColor="#726080" />
          <stop offset=".5" stopColor="#c2a8cc" />
          <stop offset="1" stopColor="#4c3b69" />
        </linearGradient>
        <radialGradient id="orb">
          <stop stopColor="#fff" />
          <stop offset=".2" stopColor="#e5caff" />
          <stop offset=".55" stopColor="#ae6bff" />
          <stop offset="1" stopColor="#6c36bb" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <ellipse
        cx="300"
        cy="441"
        rx="145"
        ry="22"
        fill="#9e63ff"
        opacity=".12"
      />
      <g className="mage-body">
        <path
          d="M276 167 Q227 183 206 236 L170 373 215 385 199 441 Q298 467 401 441 L373 317 377 229 Q349 181 328 171Z"
          fill="url(#robe)"
          stroke="#77618e"
          strokeWidth="1.5"
        />
        <path
          d="M269 184 L237 268 221 434 276 409 303 242 319 436 370 444 350 283 326 184"
          fill="#151529"
          stroke="#554368"
          strokeWidth="2"
        />
        <path
          d="M274 203 L292 253 274 395 246 441 M326 204 L306 254 337 438"
          fill="none"
          stroke="url(#trim)"
          strokeWidth="5"
        />
        <path
          d="M258 244 L279 265 M336 244 L318 265 M270 283 L283 291 M326 283 L314 291"
          stroke="#9983b1"
          strokeWidth="3"
        />
        <path
          d="M250 134 Q259 70 302 52 Q349 83 359 145 L341 207 303 235 256 203 239 166Z"
          fill="url(#hood)"
          stroke="#8b72a2"
          strokeWidth="2"
        />
        <path
          d="M300 86 Q267 112 258 160 L274 187 303 210 335 180 341 153 Q326 113 300 86"
          fill="#090c18"
          stroke="#6d5688"
          strokeWidth="3"
        />
        <path
          d="M270 150 L291 155 286 161 272 157 M313 155 L333 149 330 157 314 162"
          fill="#cd9dff"
          filter="url(#glow)"
        />
        <path
          d="M270 150 L291 155 286 158 273 155 M313 155 L333 149 330 155 314 159"
          fill="#ead5ff"
        />
        <path
          d="M297 163 L293 181 306 181 M287 192 Q302 197 315 187"
          fill="none"
          stroke="#695172"
          strokeWidth="2"
        />
        <path
          d="M247 208 L216 218 184 283 149 276 134 305 184 333 219 311 245 258"
          fill="url(#robe)"
          stroke="#77618e"
          strokeWidth="2"
        />
        <path
          d="M351 209 L377 221 405 292 439 264 458 289 407 335 373 318 345 259"
          fill="url(#robe)"
          stroke="#77618e"
          strokeWidth="2"
        />
        <path
          d="M139 280 L125 263 116 270 121 283 108 277 104 285 132 305 150 293"
          fill="#8c789f"
        />
        <path d="M432 271 L449 253 464 260 461 279 446 291" fill="#8c789f" />
        <path d="M451 169 L439 437" stroke="#554365" strokeWidth="10" />
        <path d="M451 169 L439 437" stroke="#ab8abd" strokeWidth="3" />
        <path
          d="M451 185 L431 153 434 125 451 145 469 123 474 151Z"
          fill="#463456"
          stroke="#ae8bc9"
          strokeWidth="2"
        />
        <circle cx="453" cy="128" r="42" fill="url(#orb)" />
        <path d="M453 108 L464 128 452 148 443 129Z" fill="#d5b0ff" />
        <path d="M453 108 L453 148 443 129Z" fill="#9860d5" />
        <path
          d="M290 237 L304 225 317 238 304 253Z"
          fill="#8d67ad"
          stroke="#bd9ad3"
        />
        <circle cx="304" cy="238" r="4" fill="#e0baff" />
      </g>
      <g fill="#c69aff">
        <circle cx="115" cy="240" r="3" />
        <circle cx="145" cy="226" r="2" />
        <circle cx="128" cy="210" r="2" />
        <circle cx="480" cy="105" r="2" />
        <circle cx="424" cy="91" r="2" />
      </g>
    </svg>
  );
}


import { useRef, useEffect, useState } from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import anime from "animejs";
import * as d3 from "d3";
import * as PIXI from 'pixi.js'

let RAF_CALLBACKS = [];

let elsId = 1;
let leftElements = d3.range(0, 10).map(_ => newElement());
const LINE_WIDTH = 4;
const HAS_TOUCH = 'ontouchstart' in document.documentElement
    || navigator.maxTouchPoints > 0
    || navigator.msMaxTouchPoints > 0;

const mmReplace = (v) => v.replace(/[JSP]/g, c => c.toLowerCase())

const itemsToShow = [
  {
    name: "William Morris Patterns",
    preview: "/previews/wm.jpg",
    background: "/bgs/wm.jpg",
    text: "technologies: Blender, Python. Permission granted by william morris gallery",
    link: "https://www.youtube.com/watch?v=pLX73l67GHs"
  },
  {
    name: "Josef Albers Study",
    preview: "/previews/ja.jpg",
    background: "/bgs/ja.jpg",
    text: "technologies: JavaScript, Python, HTML, CSS",
    link: "https://www.youtube.com/watch?v=VQtmqifUklA"
  },
  {
    name: "Japanese Patterns",
    preview: "/previews/jpipe.jpg",
    background: "/bgs/pat.jpg",
    text: "tool: Figma",
    link: "http://www.arielakeman.com/japanese-patterns.jpg"
  },
  {
    name: "Japanese Poetry",
    preview: "/previews/jp.jpg",
    background: "/bgs/poetry.jpg",
    text: "Technologies: JavaScript, Python, HTML, CSS",
    link: "http://www.arielakeman.com/japanese-poetry"
  }
]

function WordAsLetters({ word }) {
  if (word === " ") {
    return <span> </span>
  }
  return <span className="word">{
    Array.prototype.map.call(word,
    (letter, i) => <span key={i} className="letter">{ letter }</span>)
} </span>
}

function TextAsLetters({ text }) {
  return <span className="anim-text">
    {
      text.split(" ").reduce((accum, word) => {
        if (accum.length) {
          return [...accum, ' ', word]
        }
        return [word]
      }, []).map((word, i) => <WordAsLetters key={i} word={word} />)
  }
  </span> 
}

function bgAnimResize(obj) {
  const parent = obj.el.parentNode;
  const width = parent.offsetWidth;
  const height = parent.offsetHeight;
  obj.app.renderer.resize(width, height);

  const tex = obj.tex;
  const image = obj.image;
  const aspectRatio = tex.orig.width / tex.orig.height;

  const res = window.devicePixelRatio || 1;
  let finalWidth = width;
  let finalHeight = width / aspectRatio;

  if (finalHeight < height) {
    finalHeight = height;
    finalWidth = finalHeight * aspectRatio;
  }

  image.width = finalWidth / res;
  image.height = finalHeight / res;
}

// https://redstapler.co/ultra-realistic-water-ripple-effect-javascript-tutorial/
function bgAnimInit(el, bgImage) {
  const elWidth = el.offsetWidth;
  const elHeight = el.offsetHeight;    

  const app = new PIXI.Application({
    width: elWidth,
    height: elHeight,
    backgroundColor: 0xffffff,
    resolution: window.devicePixelRatio || 1
  });
  el.appendChild(app.view);
  const tex = PIXI.Texture.from(bgImage);
  const image = new PIXI.Sprite.from(tex);
  app.stage.addChild(image);

  const displacementSprite = new PIXI.Sprite.from("/texture.jpg");
  const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
  displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  app.stage.addChild(displacementSprite);
  app.stage.filters = [displacementFilter];

  app.renderer.view.style.transform = 'scale(1.1)';
  app.renderer.view.style.left = '20px';
  displacementSprite.scale.x = 0.8;
  displacementSprite.scale.y = 0.8;

  return {
    el, app, displacementSprite, tex, image
  };
}

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

function Item(obj) {

  const bgRef = useRef();
  const size = useWindowSize();

  useEffect(() => {
    if (!bgRef || !bgRef.current)
      return;

    RAF_CALLBACKS.push({
      id: obj.name,
      live: false,
      _obj: bgAnimInit(bgRef.current, obj.background),
      callback: (obj) => {
        obj._obj.displacementSprite.x += (4 + Math.random() * 4);
        obj._obj.displacementSprite.y += (4 + Math.random() * 4);
      }
    })
  }, [bgRef, obj.background, obj.name])

  useEffect(() => {
    if (obj.active) {
      const cb = RAF_CALLBACKS.filter(cb => cb.id === obj.name)[0];
      if (cb) {
        bgAnimResize(cb._obj);
        cb.live = true;
      }
    } else {
      const cb = RAF_CALLBACKS.filter(cb => cb.id === obj.name)[0];
      setTimeout(() => {
        if (obj.active) {
          return;
        }
        if (cb) {
          cb.live = false;
        }
      }, 300)
    }
  }, [obj.active, obj.name, size]);

  return  <div className={"item" + (obj.active ? " active" : "")}
    onMouseOver={HAS_TOUCH ? undefined : () => obj.setActive()}
    onTouchStart={HAS_TOUCH ? () => {
      obj.setActive()
    } : undefined}
    onClick={() => window.open(obj.link)}>
    <div className="item-bg"
      ref={bgRef}
      style={{
      position: 'absolute',
      overflow: 'hidden',
      width: '100%',
      height: '100%'
    }}>

    </div>
    <div className="container">
      <img className="preview-img" src={obj.preview} alt="preview"/>
      <div className="preview-content">
        <h1>{ <TextAsLetters text={mmReplace(obj.name)} /> }</h1>
        <br/><br/><br/>
        <h3>{ <TextAsLetters text={obj.text.toLowerCase()} /> }</h3>
      </div>
    </div>
  </div>
}

function newElement() {
    // add new element
    const altColour = Math.random() > 0.9;
    const height = altColour ? 
      20 :
      Math.max(0.4, Math.random()) * 100;
    const origSpeed = Math.max(0.5, Math.random()) * 2;

    return {
      id: elsId++,
      age: 0,
      position: -height,
      height: height,
      origSpeed: origSpeed,
      speed: 0,
      colour: altColour ? '#ff00ff' : 'white'
    }
}

function startRAFLoop() {

  (function loop() {
    for (let i = 0; i < RAF_CALLBACKS.length; i++) {
      const item = RAF_CALLBACKS[i];
      if (item.live) {
        item.callback(item);
      }
    }  
    requestAnimationFrame(loop)
  })()
}

function leftBandAnim(el) {

  return function() {
    const pageHeight = document.body.clientHeight;

    for (let i = 0; i < leftElements.length; i++) {
      leftElements[i].age += 1;
      leftElements[i].speed = Math.max(0.25, leftElements[i].origSpeed - leftElements[i].age / 1000);
      leftElements[i].position += 10 * leftElements[i].speed;
    }

    let len = leftElements.length;
    while (len--) {
      let el = leftElements[len];
      if ((el.position) > pageHeight) {
        leftElements.splice(len, 1);
      }
    }

    if (Math.random() > 0.90) {
      leftElements.push(newElement());
    }

    d3.select(el)
      .selectAll(".bar")
      .data(leftElements, e => e.id)
      .join(
        enter => enter
            .append("div")
            .attr("class", "bar")
            .style('background', e => e.colour),
        update => update
          .style("position", 'absolute')
          .style('left', 0)
          .style('top', e => e.position + 'px')
          .style('width', LINE_WIDTH + 'px')
          .style('height', e => e.height + 'px')
          .style('filter', 'saturate(1.5) brightness(1.5)')
          .style('mix-blend-mode', 'difference')
      )
  }
}

function App() {

  const leftBandsRef = useRef();
  const [isInit, setIsInit] = useState(false);
  const [toggleEmail, setToggleEmail] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const pageHeight = document.body.clientHeight || 1000;

  useEffect(() => {

    if (!window.chrome) {
      document.body.classList.add("not-chrome");
    }

    setTimeout(() => {
        setIsInit(true);
        setSelectedIndex(0);
    }, 2000);

    ['h1 .letter', 'h3 .word', '.preview-img'].forEach((target) => {

      const isWord = !!target.match(/word/ig);

      anime.timeline({loop: false})
        .add({
          targets: target,
          scale: [1.2, 1],
          translateY: (el, idx) => [-25 - Math.min(135, idx/2),0],
          translateX: (el, idx) => [-25 - Math.min(135, idx/2),0],
          opacity: [0, 1],
          easing: "easeOutExpo",
          duration: 1200,
          delay: (el, idx) => 
            isWord ?
              1000 + Math.min(idx * 80, 2000) :
              Math.min(idx * 20, 2000)
        })
      });
  // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (!leftBandsRef || !leftBandsRef.current)
      return;

    RAF_CALLBACKS.push({
      callback: leftBandAnim(leftBandsRef.current),
      live: true,
      id: 'left-bar'
    });

    startRAFLoop();

  }, [leftBandsRef]);

  return <div>arie lakeman</div>

  return (
    <Router>
    <div className="">

      <div ref={leftBandsRef}
        className="left-band"
        style={{
          position: 'absolute',
          overflow: 'hidden',
          left: 55,
          top: 0,
          height: pageHeight,
          width: LINE_WIDTH
        }}>
      </div>

      <Switch>
        <Route exact path="/">
          <div>
            <div className="container">
              <h1><TextAsLetters text="arie lakeman"/></h1>
              <h3>
                <a className="link" href="/cv.pdf" rel="noopener noreferrer" target="_blank"><TextAsLetters text="cv" /></a>
                <TextAsLetters text=", " />
                <span className={toggleEmail ? "" : "link"} onClick={() => setToggleEmail(true)}><TextAsLetters text={toggleEmail ? "arie.lakeman@gmail.com" : "@email"}/></span>
                <TextAsLetters text=", selected work:"/>
              </h3>
            </div>
            {
              itemsToShow.map((obj, i) => 
                  <Item
                    active={selectedIndex === i}
                    key={i}
                    setActive={() => {
                      if (isInit) {
                        setSelectedIndex(i);
                      }
                    }}
                    {...obj} />)
            }
          </div>
          <div style={{
            textAlign: 'center',
            padding: '40px 0 40px 0',
            fontSize: '1rem'
          }}><a className="link" target="_blank" rel="noopener noreferrer" href="https://github.com/ariejdl/al-site">github source</a></div>
        </Route>)
      </Switch>
    </div>
    </Router>
  );
}

export default App;

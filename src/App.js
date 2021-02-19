
import { useRef, useEffect, useState } from 'react';
import './App.css';
import {
  useLocation,
  withRouter,
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import anime from "animejs";
import * as d3 from "d3";
import * as PIXI from 'pixi.js'

let RAF_CALLBACKS = [];

let elsId = 1;
let leftElements = d3.range(0, 10).map(_ => newElement());
const LINE_WIDTH = 4;

function loadImage(url) {
  return new  Promise(resolve => {
      const image = new Image();
      image.addEventListener('load', () => {
          resolve(image);
      });
      image.src = url; 
  });
}

const mmReplace = (v) => v.replace(/[JSP]/g, c => c.toLowerCase())

const itemsToShow = [
  {
    name: "William Morris Patterns",
    preview: "/previews/wm.jpg",
    background: "/bgs/wm.jpg",
    text: "technologies: Blender, Python.  Permission granted by william morris gallery"
  },
  {
    name: "Josef Albers Study",
    preview: "/previews/ja.jpg",
    background: "/bgs/ja.jpg",
    text: "technologies: JavaScript, Python, HTML, CSS"
  },
  {
    name: "Japanese Patterns",
    preview: "/previews/jpipe.jpg",
    background: "/bgs/pat.jpg",
    text: "tool: Figma"
  },
  {
    name: "Japanese Poetry",
    preview: "/previews/jp.jpg",
    background: "/bgs/poetry.jpg",
    text: "Technologies: JavaScript, Python, HTML, CSS"
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

// https://redstapler.co/ultra-realistic-water-ripple-effect-javascript-tutorial/
function bgAnimInit(el, bgImage) {
  const elWidth = el.offsetWidth;
  const elHeight = el.offsetHeight;    

  const app = new PIXI.Application({ width: elWidth, height: elHeight });
  el.appendChild(app.view);
  const image = new PIXI.Sprite.from(bgImage);
  image.width = elWidth;
  image.height = elHeight;
  app.stage.addChild(image);

  const displacementSprite = new PIXI.Sprite.from("/texture.jpg");
  const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
  displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  app.stage.addChild(displacementSprite);
  app.stage.filters = [displacementFilter];

  app.renderer.view.style.transform = 'scale(1.02)';
  displacementSprite.scale.x = 4;
  displacementSprite.scale.y = 4;

  return {
    app, displacementSprite
  };
}

function Item(obj) {

  const bgRef = useRef();

  // RAF_CALLBACKS

  useEffect(() => {
    if (!bgRef || !bgRef.current)
      return;

    const animObj = bgAnimInit(bgRef.current, obj.background)

    RAF_CALLBACKS.push({
      id: obj.name,
      callback: () => {
        animObj.displacementSprite.x += 10;
        animObj.displacementSprite.y += 4;
      }
    })
  }, [bgRef])

  return  <div className="item"
    onMouseOver={() => {
      console.log('over')
    }}
    onMouseOut={() => {
      console.log('out')
    }}>
    <div 
      ref={bgRef}
      style={{
      position: 'absolute',
      overflow: 'hidden',
      opacity: 0.2,
      /*
      background: `url(${obj.background})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      */
      width: '100%',
      height: '100%'
    }}>

    </div>
    <div className="container">
      <img className="preview-img" src={obj.preview}/>
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
      RAF_CALLBACKS[i].callback();
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
  const [mousePos, setMousePos] = useState();
  const pageHeight = document.body.clientHeight || 1000;

  useEffect(() => {

    if (!window.chrome) {
      document.body.classList.add("not-chrome");
    }

    ['h1 .letter', 'h3 .word', '.preview-img'].map((target) => {

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
  }, [])

  useEffect(() => {
    if (!leftBandsRef || !leftBandsRef.current)
      return;

    RAF_CALLBACKS.push({
      callback: leftBandAnim(leftBandsRef.current),
      id: 'left-bar'
    });

    startRAFLoop();

  }, [leftBandsRef])

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
          {
            mousePos ?
              <div></div> : null
          }
          <div onMouseMove={(e) => {setMousePos({ x: e.pageX, y: e.pageY })}}>
            <div className="container">
              <h1><TextAsLetters text="arie lakeman"/></h1>
              <h3><TextAsLetters text="cv" /><TextAsLetters text=", " /><TextAsLetters text="@email"/><TextAsLetters text=", selected work:"/></h3>
            </div>
            {
              itemsToShow.map((obj, i) => <Item key={i} {...obj} />)
            }
          </div>
          <div style={{
            textAlign: 'center',
            padding: '40px 0 40px 0',
            fontSize: '1rem'
          }}>...</div>
        </Route>)
      </Switch>
    </div>
    </Router>
  );
}

export default App;

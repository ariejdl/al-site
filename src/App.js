
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
    preview: "/previews/wm.jpg"
  },
  {
    name: "Josef Albers Study",
    preview: "/previews/ja.jpg"
  },
  {
    name: "Japanese Patterns",
    preview: "/previews/jpipe.jpg"
  },
  {
    name: "Japanese Poetry",
    preview: "/previews/jp.jpg"
  }
]

function TextAsLetters({ text }) {
  return <span className="anim-text">{
    Array.prototype.map.call(text,
      (letter, i) => <span key={i} className="letter">{ letter === " " ? "\xa0" : letter }</span>)
  }</span> 
}

function Item(obj) {

  return  <div className="container item">
    <img className="preview-img" src={obj.preview}/>
    <div className="preview-content">
      <h1>{ <TextAsLetters text={mmReplace(obj.name)} /> }</h1>
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

// https://css-tricks.com/using-requestanimationframe-with-react-hooks/
const useAnimationFrame = callback => {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  const animate = time => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime)
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // Make sure the effect runs only once
}

let elsId = 1;
let leftElements = d3.range(0, 10).map(_ => newElement());
const LINE_WIDTH = 4;

function App() {

  const leftBandsRef = useRef();
  const [mousePos, setMousePos] = useState();
  const pageHeight = document.body.clientHeight || 1000;

  useEffect(() => {

      anime.timeline({loop: false})
        .add({
          targets: `h1 .letter, h3 .letter, .preview-img`,
          scale: [1.2, 1],
          translateY: (el, idx) => [-25 - Math.min(135, idx/2),0],
          translateX: (el, idx) => [-25 - Math.min(135, idx/2),0],
          opacity: [0, 1],
          easing: "easeOutExpo",
          duration: 1200,
          delay: (el, idx) => Math.min(15 * idx, 2000)
        })
  }, [])

  useAnimationFrame(() => {
    const pageHeight = document.body.clientHeight;
    if (!leftBandsRef || !leftBandsRef.current)
      return;

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

    d3.select(leftBandsRef.current)
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
  })

  return (
    <Router>
    <div className="">

      <div ref={leftBandsRef}
        style={{
          position: 'absolute',
          overflow: 'hidden',
          left: 55,
          opacity: 0.6,
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
        </Route>)
      </Switch>
    </div>
    </Router>
  );
}

export default App;

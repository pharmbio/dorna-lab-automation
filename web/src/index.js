import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import graph from './graph.json';
import Mode from './Components/Mode'
import Positions from './Components/Positions'
import Information from './Components/Information'

// SYSTEM STATE MACHINE:

class System extends React.Component {
  constructor(props) {
    super(props);

    const positions = graph.positions
    const obj = {};

    for (const key of positions) {
      obj[key] = "empty"
    }

    this.state = {
      frame: "control", // control, dorna, flowbot
      mode: "setup", // setup, source, target, ready, moving
      plates: obj, // entries can be: empty, full, source, target
      initial: structuredClone(obj) // copy
    }
  }

  ready(source, target) {
    const plates = this.state.plates;
    plates[source] = "empty";
    plates[target] = "full";
    const initial = structuredClone(plates);
    this.setState({
      mode: "source",
      initial: initial,
      plates: plates
    })
  }

  requestMove() {

    const plates = this.state.plates;
    const source = Object.keys(plates).find(key => plates[key] === "source");
    const target = Object.keys(plates).find(key => plates[key] === "target");
    console.log(source + " ==> " + target);

    fetch("http://localhost:5000/move?target="+source)
      .then(res => {
        console.log(res)
        fetch("http://localhost:5000/pickup")
          .then(res => {
            console.log(res)
            fetch("http://localhost:5000/move?source="+source+"&target="+target)
              .then(res => {
                console.log(res)
                  fetch("http://localhost:5000/place")
                    .then(res => {
                      console.log(res)
                      this.ready(source, target)
                    })
              })
          })
      })
  }

  abortMove() {
    fetch("http://localhost:5000/halt")
      .then(response => response.json())
      .then(data => console.log(data))
  }

  resetPlates() {
    const initial = structuredClone(this.state.initial);
    this.setState({plates: initial});
  }

  handleChangeClick() {
    switch(this.state.mode) {
      case "setup":
        const plates = structuredClone(this.state.plates);
        this.setState({initial: plates})
        this.setState({mode: "source"});
        break;
      case "source":
        this.setState({mode: "setup"});
        this.resetPlates();
        break;
      case "target":
        this.setState({mode: "source"});
        this.resetPlates();
        break;
      case "ready":
        this.setState({mode: "source"});
        this.resetPlates();
        break;
      default: break;
    }
  }

  handleRunClick() {
    switch(this.state.mode) {
      case "ready":
        this.setState({mode: "moving"});
        this.requestMove();
        break;
      case "moving":
        this.setState({mode: "ready"});
        this.abortMove();
        break;
      default: break;
    }
  }

  handlePlateClick(id) {
    const plates = this.state.plates;
    switch(this.state.mode) {
      case "setup": plates[id] = plates[id] === "empty" ? "full" : "empty"; break;
      case "source":
        if (plates[id] === "full") {
          plates[id] = "source";
          this.setState({mode: "target"});
        }
        break;
      case "target":
        if (plates[id] === "empty") {
          plates[id] = "target";
          this.setState({mode: "ready"});
        }
        break;
      default: break;
    }
    this.setState({plates: plates})
  }

  // const className = props.id + " position " + props.plate;
  // return <button className={className} onClick={props.onClick}>{props.id}</button>
  // frame: "control", // control, dorna, flowbot
  // this.setState({mode: "target"});

  render() {
    let content;
    let controlLink, dornaLink, flowbotLink = "nav-link"


    switch(this.state.frame) {
      case("dorna"):
        dornaLink = "nav-link active"
        content = (
          <iframe src="http://lab.dorna.ai/"/>
        )
        break;
      case("control"):
        controlLink = "nav-link active"
        content = (
          <div>
            <Mode
              mode={this.state.mode}
              onChangeClick={() => this.handleChangeClick()}
              onRunClick={() => this.handleRunClick()}
            />
            <Positions
              plates={this.state.plates}
              handlePlateClick={(id) => this.handlePlateClick(id)}
            />
            <Information mode={this.state.mode}/>
          </div>
        )
        break;
      case("flowbot"):
        flowbotLink = "nav-link active"
        content = (
          <iframe src="https://portal.flow-robotics.com/login?next=%2Fapidocs%2Findex.html"/>
        )
        break;
    }

    return (
      <div className="container">
        {content}
        <nav className="navbar fixed-bottom bg-light">
          <div className="container-fluid">
            <a className={dornaLink} href="#" onClick={() => this.setState({frame: "dorna"})}>Dorna lab</a>
            <a className={controlLink} href="#" onClick={() => this.setState({frame: "control"})}>Automation control</a>
            <a className={flowbotLink} href="#" onClick={() => this.setState({frame: "flowbot"})}>Flowbot</a>
          </div>
        </nav>
      </div>
    );
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<System />);

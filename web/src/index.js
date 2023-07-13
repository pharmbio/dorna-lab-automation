import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import Header from './Components/Header'
import Positions from './Components/Positions'
import Content from './Components/Content'

import graph from './graph.json';

// SYSTEM STATE MACHINE:
class System extends React.Component {
  constructor(props) {
    super(props);

    // Collected from graph.json
    const positions = graph.positions
    const obj = {};

    for (const key of positions) {
      obj[key] = "empty"
    }

    // This portrays the initial state of the system and possible state values
    this.state = {
      stage: "preflight",     // preflight, calibration, setup, select, move
      stage: "calibration",         // for development
      moving: true,          // true, false
      plates: obj,            // entries can be: empty, full, source, target
      initial: structuredClone(obj), // copy
      statusText: "hello my name is"
    }
  }

  changeStage(stage) {
    let plates = structuredClone(this.state.plates);
    let initial = structuredClone(this.state.initial);

    // If current stage is setup, save plate configuration to state.initial
    if (this.state.stage === "setup") {
      initial = structuredClone(plates);
    }

    switch(stage) {
      case "preflight":
        Object.keys(plates).forEach((item) => {
	  plates[item] = "empty"
	});
        break;
      case "calibration":
        Object.keys(plates).forEach((item) => {
	  plates[item] = "empty"
	});
        break;
      case "setup":
        plates = initial; break;
      case "select":
        plates = initial; break;
      case "move":
        let target = Object.keys(plates).find(key => plates[key] == "target");
        let source = Object.keys(plates).find(key => plates[key] == "source");
        let text = (
          target || source ? "Missing" : "what the fuck"
        )
        this.changeStatusText(text, 500)

        break;
    }
    this.setState({ 
      stage: stage, 
      plates: plates, 
      initial: initial
    }) 
  }

  changeStatusText(string, duration) {
    // If no duration is supplied, change status permanently
    if (duration) {
      setTimeout(() => this.setState({statusText: ""}), duration)
    }
    this.setState({statusText: string})
  }

  handleHeaderClick(stage) {
    this.changeStage(stage)
  }

  handlePrevClick() {
    switch(this.state.stage) {
      case "preflight":
        console.log("Already at first stage"); break;
      case "calibration":
        this.changeStage("preflight"); break;
      case "setup":
        this.changeStage("calibration"); break;
      case "select":
        this.changeStage("setup"); break;
      case "move":
        this.changeStage("select"); break;
    }
  }

  handleNextClick() {
    switch(this.state.stage) {
      case "preflight":
        this.changeStage("calibration"); break;
      case "calibration":
        this.changeStage("setup"); break;
      case "setup":
        this.changeStage("select"); break;
      case "select":
        this.changeStage("move"); break;
      case "move":
        console.log("Already at final stage"); break;
    }
  }

  handlePlateClick(id) {
    const plates = structuredClone(this.state.plates);
    switch(this.state.stage) {

      // During calibrtion, only one plate can be selected at a time
      case "calibration": 
        Object.keys(plates).forEach((item) => {
	  plates[item] = "empty"
	})
        plates[id] = "full"
	break;

      // During setup, plates should toggle state
      case "setup": 
        plates[id] = plates[id] == "empty" ? "full" : "empty"; 
        break;

      // When picking source and target, 
      // states should toggle and only one source/target can be selected
      case "select":
        switch(plates[id]) {
          case "full": 
            Object.keys(plates).forEach(item => {
              if (plates[item] == "source") {
                plates[item] = "full";
              }
            })
            plates[id] = "source";
            break;
          case "empty":
            Object.keys(plates).forEach(item => {
              if (plates[item] == "target") {
                plates[item] = "empty";
              }
            })
            plates[id] = "target";
            break;
          case "source":
            plates[id] = "full"
            break;
          case "target":
            plates[id] = "empty"
            break;
        }
        break;

      // Plate interaction is disabled when ready for movement
      case "move":
        break;

      default: break;
    }
    this.setState({plates: plates})
  }


  handleButtonClick(entry) {
    const stage = this.state.stage

    switch(stage) {
      case "calibration":
        const plates = this.state.plates
        let target = Object.keys(plates).find(key => plates[key] === "full");
        switch(entry) {

          case "Move":
            fetch("/move?target="+target).then((response) => {
              return response.json()
            })
            .then(responseJson => {
              console.log(responseJson)
              this.changeStatusText(responseJson, 500)
            })
            break;

          case "Save":
            console.log("Updated " + target + " with new coordinates. Written to calibration.json")
            fetch("/save?node="+target)
              .then(res => {
                console.log(res)
              })
            break;

          default: break;
        }
    
    }
  }

  render() {
    return (
      <div>
        <div className="section">
          <Header
            stage={this.state.stage}
            plates={this.state.plates}
            onHeaderClick={(stage) => this.handleHeaderClick(stage)}
            onPrevClick={() => this.handlePrevClick()}
            onNextClick={() => this.handleNextClick()}
          />
        </div>

        <div className="section">
          <Positions
            plates={this.state.plates}
            onPlateClick={(id) => this.handlePlateClick(id)}
          />
        </div>

        <div className="section">
          <Content 
            moving={this.state.moving}
            stage={this.state.stage} 
            onButtonClick={(id) => this.handleButtonClick(id)}
            statusText={this.state.statusText}
          />
        </div>
      </div>
    );
  }
}

// ========================================
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<System />);

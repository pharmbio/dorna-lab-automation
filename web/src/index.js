import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import Header from './Components/Header'
import Positions from './Components/Positions'
import Content from './Components/Content'

import graph from './graph.json';

const PlatePositionStatus={
  empty: "empty",
  full: "full",
  target: "target",
  source: "source"
}

const Stage={
  preflight:"preflight",
  calibration: "calibration",
  setup:"setup",
  move:"move",
  select:"select"
}

/// stage-specific buttons
const StageButton={
  Move: "Move",
  Run: "Run",
  Save: "Save",
  Reset: "Reset"
}

// SYSTEM STATE MACHINE:
class System extends React.Component {
  constructor(props) {
    super(props);

    // Collected from graph.json
    const positions = graph.positions
    const obj = {};

    for (const key of positions) {
      obj[key] = PlatePositionStatus.empty
    }

    // This portrays the initial state of the system and possible state values
    this.state = {
      stage: Stage.preflight,
      moving: false,
      plates: obj,
      initial: structuredClone(obj), // copy
      statusText: ""
    }
  }

  changeStage(stage) {
    let plates = structuredClone(this.state.plates);
    let initial = structuredClone(this.state.initial);

    // If current stage is Setup, save plate configuration to state.initial
    if (this.state.stage == Stage.setup) {
      initial = structuredClone(plates);
    }

    // If current stage is Move, remove "Ready for move!" statusText
    if (this.state.stage == Stage.move) {
      this.changeStatusText("")
    }

    switch(stage) {
      case Stage.preflight:
        Object.keys(plates).forEach((item) => {
          plates[item] = PlatePositionStatus.empty
        });
        break;
      case Stage.calibration:
        Object.keys(plates).forEach((item) => {
          plates[item] = PlatePositionStatus.empty
        });
        break;
      case Stage.setup:
        plates = initial; break;
      case Stage.select:
        plates = initial; break;
      case Stage.move:
        let source = Object.keys(plates).find(key => plates[key] == PlatePositionStatus.source);
        let target = Object.keys(plates).find(key => plates[key] == PlatePositionStatus.target);

        var text = null
        if (!(source || target)){
          text="Missing both source and target" 
        }else if (!source){
          text="Missing source"
        }else if(!target){
          text="Missing target"
        }

        if (text) {
          this.changeStatusText(text, 3000)
          return
        }
        this.changeStatusText("Ready for move!")
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
      case Stage.preflight:
        break
      case Stage.calibration:
        this.changeStage(Stage.preflight)
        break
      case Stage.setup:
        this.changeStage(Stage.calibration)
        break
      case Stage.select:
        this.changeStage(Stage.setup)
        break
      case Stage.move:
        this.changeStage(Stage.select)
        break
    }
  }

  handleNextClick() {
    switch(this.state.stage) {
      case Stage.preflight:
        this.changeStage(Stage.calibration)
        break
      case Stage.calibration:
        this.changeStage(Stage.setup)
        break
      case Stage.setup:
        this.changeStage(Stage.select)
        break
      case Stage.select:
        this.changeStage(Stage.move)
        break
      case Stage.move:
        break
    }
  }

  handlePlateClick(plate_id) {
    const plates = structuredClone(this.state.plates);
    switch(this.state.stage) {
      // During calibration, only one plate can be selected at a time
      case Stage.calibration: 
        Object.keys(plates).forEach((item) => {
          plates[item] = PlatePositionStatus.empty
        })
        plates[plate_id] = PlatePositionStatus.full
  	    break
 
      // During setup, plates should toggle state
      case Stage.setup: 
        plates[plate_id] = plates[plate_id] == PlatePositionStatus.empty ? PlatePositionStatus.full : PlatePositionStatus.empty
        break

      // When picking source and target, 
      // states should toggle and only one source/target can be selected
      case Stage.select:
        switch(plates[plate_id]) {
          case PlatePositionStatus.full: 
            Object.keys(plates).forEach(item => {
              if (plates[item] == PlatePositionStatus.source) {
                plates[item] = PlatePositionStatus.full
              }
            })
            plates[plate_id] = PlatePositionStatus.source
            break

          case PlatePositionStatus.empty:
            Object.keys(plates).forEach(item => {
              if (plates[item] == PlatePositionStatus.target) {
                plates[item] = PlatePositionStatus.empty
              }
            })
            plates[plate_id] = PlatePositionStatus.target
            break

          case PlatePositionStatus.source:
            plates[plate_id] = PlatePositionStatus.full
            break

          case PlatePositionStatus.target:
            plates[plate_id] = PlatePositionStatus.empty
            break
        }
        break

      // Plate interaction is disabled during Preflight and Move stages
      default:
          break
    }
    this.setState({plates: plates})
  }


  async handleButtonClick(id) {
    const plates = structuredClone(this.state.plates);
    switch(this.state.stage) {


      // During Calibratioon stage:
      case Stage.calibration:
        let selected = Object.keys(plates).find(key => plates[key] === PlatePositionStatus.full)

        // Perform different things based on button identity:
        switch(id) {
          case StageButton.Move:
            this.setState({moving: true, statusText: "moving"})
            await fetch("/move?target="+selected).then((response) => {
              return response.json()
            })
            .then(responseJson => {
              console.log(responseJson)
              this.changeStatusText(responseJson, 3000)
              this.setState({moving: false})
            })
            break

          case StageButton.Save:
            this.setState({statusText: "loading"})
            await fetch("/save?node="+selected).then((response) => {
              return response.json()
            })
            .then(responseJson => {
              console.log(responseJson)
              this.changeStatusText(responseJson, 3000)
            })
            break

          case StageButton.Reset:
            this.setState({statusText: "loading"})
            await fetch("/reset?node="+selected).then((response) => {
              return response.json()
            }).then(responseJson => {
              console.log(responseJson)
              this.changeStatusText(responseJson, 3000)
            })
            break

          default:
            break
        }


      // During Move stage:
      case Stage.move:
        if (id == StageButton.Run) {
          let source = Object.keys(plates).find(key => plates[key] === PlatePositionStatus.source)
          let target = Object.keys(plates).find(key => plates[key] === PlatePositionStatus.target)

          this.setState({moving: true, statusText: "moving"})

          await fetch("/move?target="+source).then((response) => {
            return response.json()
          }).then(responseJson => {
            console.log(responseJson)
            this.changeStatusText(responseJson, 3000)
          })

          await fetch("/pickup").then((response) => {
            return response.json()
          }).then(responseJson => {
            console.log(responseJson)
            this.changeStatusText(responseJson, 3000)
          })

          await fetch("/move?target="+target).then((response) => {
            return response.json()
          }).then(responseJson => {
            console.log(responseJson)
            this.changeStatusText(responseJson, 3000)
          })

          await fetch("/place").then((response) => {
            return response.json()
          }).then(responseJson => {
            console.log(responseJson)
            this.changeStatusText(responseJson, 3000)
            this.setState({moving: false})
          })

          this.changeStage(Stage.select)

          plates[target]=PlatePositionStatus.full
          plates[source]=PlatePositionStatus.empty
          this.setState({plates: plates})
        }
        break
      default:
        break
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

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import Header from './Components/Header'
import Positions from './Components/Positions'
import { Content, StageButton } from './Components/Content'

import graph from './graph.json';

import { Stage, PlatePositionStatus, positions,get_pos } from './definitions'

// SYSTEM STATE MACHINE:
class System extends React.Component {
  constructor(props) {
    super(props);

    // Collected from graph.json
    const plate_position_status = {};

    for (const key of positions) {
      plate_position_status[key.display_name] = PlatePositionStatus.empty
    }

    // This portrays the initial state of the system and possible state values
    this.state = {
      stage: Stage.preflight,
      moving: false,
      plates: plate_position_status,
      initial: structuredClone(plate_position_status), // copy
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

  /// locks interface to disallow further inputs
  lock_interface(){
    this.setState({moving: true, statusText: "moving"})
  }
  /// unlocks interface againxcsdf
  unlock_interface(){
    this.setState({moving: false})
  }

  async savePositionCalibration(target_position_name){
    const target_position=get_pos(target_position_name)
    await fetch("/save?node="+target_position.graph_node_name).then((response) => {
      return response.json()
    })
    .then(responseJson => {
      this.changeStatusText(responseJson, 3000)
    })
  }
  async resetPositionCalibration(target_position_name){
    const target_position=get_pos(target_position_name)
    await fetch("/reset?node="+target_position.graph_node_name).then((response) => {
      return response.json()
    })
    .then(responseJson => {
      this.changeStatusText(responseJson, 3000)
    })
  }

  /// main function that performs a move
  /// locks ui to stop additional input while ongoing
  async moveToPosition(target_position_name){
    this.lock_interface()

    const target_position=get_pos(target_position_name)
    await fetch("/move?target="+target_position.graph_node_name).then((response) => {
      return response.json()
    })
    .then(responseJson => {
      console.log(responseJson)
      this.changeStatusText(responseJson, 3000)
    })

    this.unlock_interface()
  }

  /// pickup plate at current position
  /// locks ui to stop additional input while ongoing
  async pickupPlateHere(){
    this.lock_interface()

    await fetch("/pickup").then((response) => {
      return response.json()
    }).then(responseJson => {
      console.log(responseJson)
      this.changeStatusText(responseJson, 3000)
    })

    this.unlock_interface()
  }
  /// place plate at current position
  /// locks ui to stop additional input while ongoing
  async placePlateHere(){
    this.lock_interface()

    await fetch("/place").then((response) => {
      return response.json()
    }).then(responseJson => {
      console.log(responseJson)
      this.changeStatusText(responseJson, 3000)
    })

    this.unlock_interface()
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
            await this.moveToPosition(selected)
            break

          case StageButton.Save:
            if(!get_pos(selected).can_be_calibrated){
              window.alert("this position cannot be calibrated")
              break
            }

            this.setState({statusText: "loading"})
            await this.savePositionCalibration(selected)
            break

          case StageButton.Reset:
            if(!get_pos(selected).can_be_calibrated){
              window.alert("this position cannot be calibrated")
              break
            }
            
            this.setState({statusText: "loading"})
            await this.resetPositionCalibration(selected)
            break

          case StageButton.PickUpPlate:
            if(!get_pos(selected).can_hold_plate){
              window.alert("this position cannot contain a plate")
              break
            }

            await this.moveToPosition(selected)
            await this.pickupPlateHere()
            break

          case StageButton.PutDownPlate:
            if(!get_pos(selected).can_hold_plate){
              window.alert("this position cannot contain a plate")
              break
            }

            await this.moveToPosition(selected)
            await this.placePlateHere()
            break

          default:
            break
        }

        break

      // During Move stage:
      case Stage.move:
        if (id == StageButton.Run) {
          let source_display_name = Object.keys(plates).find(key => plates[key] === PlatePositionStatus.source)
          let target_display_name = Object.keys(plates).find(key => plates[key] === PlatePositionStatus.target)

          await this.moveToPosition(source_display_name)
          await this.pickupPlateHere()
          await this.moveToPosition(target_display_name)
          await this.placePlateHere()

          // automatically go back plate selection stage and set source as empty, and target as full
          this.changeStage(Stage.select)
          plates[target_display_name]=PlatePositionStatus.full
          plates[source_display_name]=PlatePositionStatus.empty
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

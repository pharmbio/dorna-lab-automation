export const Stage={
    preflight:"preflight",
    calibration: "calibration",
    setup:"setup",
    move:"move",
    select:"select"
}

export const PlatePositionStatus={
    empty: "empty",
    full: "full",
    target: "target",
    source: "source"
}

import graph from './graph.json';

class GripperPosition{
    constructor(pos) {
        this.display_name=pos.display_name
        this.graph_node_name=pos.graph_node_name
        this.can_be_calibrated=pos.can_be_calibrated
        this.can_hold_plate=pos.can_hold_plate
    }
}

const json_positions = graph.positions
export const positions=json_positions.map(function(p){
    return new GripperPosition(p)
})
console.log(positions)


export function get_pos(display_name){
    for(const i in positions){
      if(positions[i].display_name==display_name){
        return positions[i]
      }
    }
    return null
  }
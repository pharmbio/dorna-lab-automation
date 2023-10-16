import json
import typing as tp
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

calibrationfile = Path("../parameters.json")

DEFAULT_GRIPPER_DUTY = {
    "prepare": 9.5,
    "grip": 8.5,
    "release": 10,
    "wide": 12
}

@dataclass
class GripperPreset:
    name: str
    move_duration: float = 0.5
    """ estimated move duration in s. required because the motor itself does not provide any status indicator as to its state """
        
    def read_properties_from_disk(self)->float:
        """ read gripper properties (just 'duty', i.e. grip width, for now) from disk """

        duty:float = DEFAULT_GRIPPER_DUTY[self.name]

        if not calibrationfile.exists():
            print(f"No calibration file found ({calibrationfile}), using default values")

        with calibrationfile.open("r") as file: duty = json.load(file).get(self.name)

        return duty

    def __call__(self,robot:"Dorna")->tp.Any:
        gripper_pwm_duty=self.read_properties_from_disk()

        # gripper on port 0 -> play command argument suffix 0 (pwm0, freq0, duty0)
        # pwm0:1 -> make sure gripper motor is on
        # freq0:50 -> from motor spec
        # duty0: <somvalue> -> set gripper width to target value (note: value does not correspond to a real-world distance directly)
        kwargs = {"cmd": "pwm", "pwm0": 1, "freq0": 50, "duty0": gripper_pwm_duty}
        status = robot.play(**kwargs)
        robot.sleep(self.move_duration)
        return status


class GripperWidth:#(GripperPreset,Enum) # <- throws 'AttributeError: can't set attribute' in enum_member.__init__ while instantiating this enum
    # Prepare for microplate pickup
    prepare=GripperPreset("prepare")
    # Grip microplate
    grip=GripperPreset("grip")
    # Release microplate
    release=GripperPreset("release")
    # Fully open gripper
    wide=GripperPreset("wide")

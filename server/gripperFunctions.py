import json
import typing as tp
from dataclasses import dataclass

calibrationfile = "../parameters.json"

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

        try:
            with open(calibrationfile, "r") as file:
                data = json.load(file)
                duty = data.get(self.name)
        except FileNotFoundError:
            print("No calibration file found, using default values")
        except OSError as e:
            # Catch other errors, such as permissions etc.
            print(f"Unable to open {calibrationfile}: {e}")

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


# Prepare for microplate pickup
prepare=GripperPreset("prepare")
# Grip microplate
grip=GripperPreset("grip")
# Release microplate
release=GripperPreset("release")
# Fully open gripper
wide=GripperPreset("wide",move_duration=3.0)

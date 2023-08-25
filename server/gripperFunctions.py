import json

port = str(0)
pwm, duty, freq = "pwm"+port, "duty"+port, "freq"+port

calibrationfile = "../gripperCalibration.json"

# This function can be run between each pickup/place
# to have the changes work in real-time
def updateServoSettings(move):
    default = {
            "prepare": 9.5,
            "grip": 8.5,
            "release": 10,
            "wide": 12
    }
    try:
        file = open(calibrationfile, "r")
        data = json.load(file)
        duty = data.get(move)
        return duty 
    except FileNotFoundError:
        print("No calibration file found, using default values")
    except OSError as e:
        # Catch other errors, such as permissions etc.
        print(f"Unable to open {calibrationfile}: {e}")

    return default[move]

# Prepare for microplate pickup
def prepare(r):
    duty = updateServoSettings("prepare")
    kwargs = {"cmd": "pwm", "pwm": 1, "freq": 50, "duty": duty}
    status = r.play(**kwargs)
    return status

# Grip microplate
def grip(r):
    duty = updateServoSettings("grip")
    kwargs = {"cmd": "pwm", "pwm": 1, "freq": 50, "duty": duty}
    status = r.play(**kwargs)
    r.sleep(0.5)
    return status

# Release microplate
def release(r):
    duty = updateServoSettings("relase")
    kwargs = {"cmd": "pwm", "pwm": 1, "freq": 50, "duty": duty}
    status = r.play(**kwargs)
    r.sleep(0.5)
    return status

# Fully open gripper
def wide(r):
    duty = updateServoSettings("wide")
    kwargs = {"cmd": "pwm", "pwm": 1, "freq": 50, "duty": duty}
    status = r.play(**kwargs)
    r.sleep(3)
    return status

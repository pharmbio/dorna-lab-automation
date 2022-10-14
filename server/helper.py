port = str(0)
pwm, duty, freq = "pwm"+port, "duty"+port, "freq"+port

# Prepare for microplate pickup
def prepare(r):
    kwargs = {"cmd": "pwm", pwm: 1, freq: 50, duty: 10}
    status = r.play(**kwargs)
    return status

# Grip microplate
def grip(r):
    kwargs = {"cmd": "pwm", pwm: 1, freq: 50, duty: 8.8}
    status = r.play(**kwargs)
    r.sleep(0.5)
    return status

# Release microplate
def release(r):
    kwargs = {"cmd": "pwm", pwm: 1, freq: 50, duty: 10}
    status = r.play(**kwargs)
    r.sleep(0.5)
    return status

# Fully open gripper
def wide(r):
    kwargs = {"cmd": "pwm", pwm: 1, freq: 50, duty: 11}
    status = r.play(**kwargs)
    r.sleep(5)
    return status

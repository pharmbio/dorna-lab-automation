import {useState, useEffect} from 'react';

export default function Calibration() {
  const [ip, setIp] = useState()
  const [info, setInfo] = useState("No connection to python server or Dorna control box.")

  // useEffect to retreive ip adress from server just once, 
  // and never update until reload thanks to []
  useEffect(() => {
    fetch("/get_dorna_ip").then((response) => {
      if (response.ok) {
        return response.json();
      }
      setInfo("No response from Python server, demo page:")
      setIp("lab.dorna.ai")
      throw new Error("No response from Python server");
    })
    .then((responseJson) => {
        setIp(responseJson.ip)
        if (responseJson.connected) {
          setInfo("")
        } else {
          setInfo("Demo page:")
        }
      })
    .catch((error) => {
        console.log(error)
      });
  }, []);

  return (
    <div>
      <h5 className="text-center">{info}</h5>
      <iframe id="iframe" className="my-auto" src={"http://"+ip}>
      </iframe>
    </div>
  )
}

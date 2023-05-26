import {useState} from 'react';

export default function Calibration() {
  const [ip, setIp] = useState()
  const [info, setInfo] = useState("Is the Dorna control box and python server on?")

  fetch("/get_dorna_ip").then((response) => {
    if (response.ok) {
      setInfo("")
      return response.json();
    }
    throw new Error("Something went wrong");
  })
  .then((responseJson) => {
      setIp(responseJson)
    })
  .catch((error) => {
      console.log(error)
    });

  return (
    <div>
      <h3 className="text-center">{info}</h3>
      <iframe id="iframe" className="my-auto" src={"http://"+ip}>
      </iframe>
    </div>
  )
}
